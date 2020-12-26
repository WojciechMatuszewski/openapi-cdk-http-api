const { AwsCdkTypeScriptApp } = require("projen");

const project = new AwsCdkTypeScriptApp({
  cdkVersion: "1.80.0",
  name: "backend",
  packageManager: "npm",
  appEntrypoint: "main.ts",
  cdkDependencies: [
    "@aws-cdk/aws-apigateway",
    "@aws-cdk/aws-cloudwatch",
    "@aws-cdk/aws-cloudwatch-actions",
    "@aws-cdk/aws-dynamodb",
    "@aws-cdk/aws-ecs",
    "@aws-cdk/aws-ecs-patterns",
    "@aws-cdk/aws-elasticloadbalancingv2",
    "@aws-cdk/aws-events",
    "@aws-cdk/aws-events-targets",
    "@aws-cdk/aws-lambda",
    "@aws-cdk/aws-rds",
    "@aws-cdk/aws-sns",
    "@aws-cdk/aws-sns-subscriptions",
    "@aws-cdk/aws-sqs",
    "@aws-cdk/core",
    "@aws-cdk/aws-stepfunctions",
    "@aws-cdk/aws-apigatewayv2",
    "@aws-cdk/aws-lambda-nodejs",
    "@aws-cdk/aws-stepfunctions-tasks"
  ],
  cdkVersionPinning: true,
  deps: [
    "aws-sdk",
    "ulid",
    "react@experimental",
    "react-dom@experimental",
    "react-server-dom-webpack@experimental",
    "react-scripts"
  ],
  devDeps: [
    "@redocly/openapi-cli",
    "esbuild",
    "@types/aws-lambda",
    "openapi-typegen",
    "@types/react",
    "@types/react-dom"
  ],
  scripts: {
    openapi: "npm run openapi:bundle && npm run openapi:types",
    predeploy: "npm run openapi && npm run synth",
    "openapi:types":
      "typegen --src ./src/openapi/openapi.generated.json --out ./src/openapi/types",
    "openapi:bundle":
      "openapi bundle ./src/openapi/openapi.yaml -o ./src/openapi/openapi.generated.json",
    start: "react-scripts start"
  },
  typescriptVersion: "4.1.3",
  tsconfig: { compilerOptions: { esModuleInterop: true } }
});

project.synth();
