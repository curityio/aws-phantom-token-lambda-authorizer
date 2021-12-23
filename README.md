# AWS Phantom Token Lambda Authorizer

[![Quality](https://img.shields.io/badge/quality-experiment-red)](https://curity.io/resources/code-examples/status/)
[![Availability](https://img.shields.io/badge/availability-source-blue)](https://curity.io/resources/code-examples/status/)

An AWS Lambda Authorizer implementing the [Phantom Token Pattern](https://curity.io/resources/learn/phantom-token-pattern/). This Lambda Authorizer function enables a secure API solution using the AWS API Gateway.

## Overview

The AWS API Gateway does not have built-in capabilities for introspecting opaque access tokens. It is however possible to extend the capabilities of the gateway with [Lambda Authorizer functions](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html).

The AWS Phantom Token Lambda Authorizer implements the Phantom Token Pattern. An opaque access token is passed in the Authorize header to the gateway. The gateway invokes the authorizer that will introspect the token using the `application/jwt` header in order to receive a JWT in the response.

The authorizer can also be configured to verify that a set of required scopes are present in the `scope` claim in the JWT or otherwise deny access to the requested API.

## Building the Lambda Authorizer

1. Clone the repository.
2. Update `.env` with the correct parameters. See the [Configuration](#Configuration) section for details.
3. Run `npm run package`. This will generate `aws-phantom-token-plugin.zip` in the current directory.

## Deploying the Lambda Authorizer

After building the authorizer, `aws-phantom-token-plugin.zip` can be uploaded and deployed as a Lambda Function in the AWS Console.

1. Choose `Create Function`
2. Select the `Author from scratch` option, set a name and choose the `Node.js 14.x` runtime.
3. Click `Create function` 
4. The default `Hello from Lambda` code is displayed. Choose `Upload from` and from the drop-down select `.zip file`. Brows to `aws-phantom-token-plugin.zip` and upload.

## Configuration

An `.env` file is bundled with the packaged authorizer before deployment. 

Parameter | Description |
--------- | ----------- |
HOST | The hostname of the Curity Identity Server
INTROSPECTION_PATH | The introspection path (`/oauth/v2/oauth-introspect`)
PORT | The runtime port of the Curity Identity Server
SCOPE | Required scopes for API access (space separated string)
CLIENT_ID | The client_id of a client with the `introspection` capability
CLIENT_SECRET | The secret of the client with the `introspection` capability

## More Information

* Please visit [curity.io](https://curity.io/) for more information about the Curity Identity Server.
* [Use API Gateway Lambda authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)

Copyright (C) 2021 Curity AB.