/*
 *  Copyright 2021 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/* Used to read values from .env */
require('dotenv').config();

/* Default deny all policy */
const defaultDenyAllPolicy = {
  "principalId":"user",
  "policyDocument":{
    "Version":"2012-10-17",
    "Statement":[
      {
        "Action":"execute-api:Invoke",
        "Effect":"Deny",
        "Resource":"*"
      }
    ]
  }
};
    
/* Generate an IAM policy statement */
function generatePolicyStatement(methodArn, action) {
  
  const statement = {};
  statement.Action = 'execute-api:Invoke';
  statement.Effect = action;
  statement.Resource = methodArn;
  return statement;
}
  
/* Generate an IAM policy */
function generatePolicy(principalId, policyStatements) {
  const authResponse = {};
  authResponse.principalId = principalId;
  const policyDocument = {};
  policyDocument.Version = '2012-10-17';
  policyDocument.Statement = policyStatements;
  authResponse.policyDocument = policyDocument;
  return authResponse;
}

function generateIAMPolicy(providedScope, user, methodArn) {
  const policyStatements = [];
  
  /* Check if token scopes exist in API Permission */
  let hasScopes =  verifyScope(providedScope, process.env.SCOPE);
  if ( hasScopes ) {
    policyStatements.push(generatePolicyStatement(methodArn, "Allow"));
  }

  /* Check if no policy statement is generated, if so, return default deny all policy statement */
  if (policyStatements.length === 0) {
    return defaultDenyAllPolicy;
  } else {
    return generatePolicy(user, policyStatements);
  }
}

/* Verify provded scope against configured required scope */
function verifyScope(providedScope, requiredScope) {
  let returnValue = true

  if(!requiredScope) { 
    return returnValue;
  }

  let providedSplitScope = providedScope.split(' ');
  let requiredSplitScope = requiredScope.split(' ');
  
  for(var i = 0; i < requiredSplitScope.length; i++) {
    if(!providedSplitScope.includes(requiredSplitScope[i])) {
      returnValue = false;
      break;
    }
  };

  return returnValue;
}

/* Introspect access token */
function introspect(options, data) {
  return new Promise((resolve, reject) => {
    var https = require('https');
    const req = https.request(options, (res) => {
      res.setEncoding("utf8");
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        resolve(responseBody);
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

exports.handler = async function(event, context) {
  
  if(!event.authorizationToken) {
    context.fail("Unauthorized");
    return;
  }
  
  const token = event.authorizationToken.replace("Bearer ", "");

  const data = new URLSearchParams();
  data.append('token', token);

  //Base64 encode client_id and client_secret to authenticate Introspection endpoint
  const introspectCredentials = Buffer.from(process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET, 'utf-8').toString('base64');

  const options = {
    host: process.env.HOST,
    path: process.env.INTROSPECTION_PATH,
    method: 'POST',
    port: process.env.PORT,
    headers: {
      'Authorization': 'Basic ' + introspectCredentials,
      'Accept': 'application/jwt', //Get Phantom Token directly in Introspection response
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': data.toString().length
    }
  };

  const jwt = await introspect(options, data.toString());
  
  if(jwt.length > 0 ) {
    const base64String = jwt.toString().split('.')[1];
    const decodedValue = JSON.parse(Buffer.from(base64String,'base64').toString('ascii'));
    
    let iamPolicy = generateIAMPolicy(decodedValue.scope, decodedValue.sub, event.methodArn);
  
    //Add Phantom Token (jwt) to context making it available to API GW to add to upstream Authorization header
    iamPolicy.context = {
      "Authorization": jwt
    };
  
    return iamPolicy;
  }
  else {
    context.fail("Unauthorized");
    return;
  }
};