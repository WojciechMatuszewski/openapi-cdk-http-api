import { readFileSync } from "fs";
import { join } from "path";
import * as apigw from "@aws-cdk/aws-apigatewayv2";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda-nodejs";
import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as sfnTasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as dynamodb from "@aws-cdk/aws-dynamodb";

const specLocation = join(__dirname, "./openapi/openapi.generated.json");
const OpenAPISpec = readFileSync(specLocation, {
  encoding: "utf-8"
});

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "notes-table", {
      partitionKey: { type: dynamodb.AttributeType.STRING, name: "pk" },
      sortKey: { type: dynamodb.AttributeType.STRING, name: "sk" },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    table.addLocalSecondaryIndex({
      indexName: "byText",
      sortKey: { type: dynamodb.AttributeType.STRING, name: "text" }
    });

    const sentimentHandler = new lambda.NodejsFunction(
      this,
      "sentimentHandler",
      {
        entry: join(__dirname, "./functions/sentiment/handler.ts"),
        handler: "handler"
      }
    );

    sentimentHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["comprehend:DetectSentiment", "comprehend:DetectSyntax"],
        resources: ["*"],
        effect: iam.Effect.ALLOW
      })
    );

    const analysisStep = new sfnTasks.LambdaInvoke(this, "performAnalysis", {
      lambdaFunction: sentimentHandler
    });

    const saveHandler = new lambda.NodejsFunction(this, "saveHandler", {
      entry: join(__dirname, "./functions/save/handler.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: table.tableName
      }
    });
    table.grantWriteData(saveHandler);

    const saveStep = new sfnTasks.LambdaInvoke(this, "saveTheData", {
      lambdaFunction: saveHandler,
      inputPath: "$.Payload"
    });

    const machine = new sfn.StateMachine(this, "apiMachine", {
      definition: analysisStep.next(saveStep),
      stateMachineType: sfn.StateMachineType.EXPRESS
    });

    const searchHandler = new lambda.NodejsFunction(this, "searchHandler", {
      entry: join(__dirname, "./functions/search/handler.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: table.tableName
      }
    });
    table.grantReadData(searchHandler);

    const listHandler = new lambda.NodejsFunction(this, "listHandler", {
      entry: join(__dirname, "./functions/list/handler.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: table.tableName
      }
    });
    table.grantReadData(listHandler);

    const getHandler = new lambda.NodejsFunction(this, "getHandler", {
      entry: join(__dirname, "./functions/get/handler.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: table.tableName
      }
    });
    table.grantReadData(getHandler);

    const api = new apigw.HttpApi(this, "testApi");
    const apiMachineRole = new iam.Role(this, "startMachineRole", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      inlinePolicies: {
        invokeMachineSync: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["states:StartSyncExecution"],
              resources: [machine.stateMachineArn]
            })
          ]
        })
      }
    });

    searchHandler.addPermission("searchInvokePermission", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:${api.httpApiId}/*/*/search`
    });

    listHandler.addPermission("listInvokePermission", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:${api.httpApiId}/*/*/list`
    });

    getHandler.addPermission("getInvokePermission", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceArn: `arn:aws:execute-api:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:${api.httpApiId}/*/*/get/*`
    });

    const cfnApi = api.node.defaultChild as apigw.CfnApi;

    const newBody = JSON.parse(
      OpenAPISpec.replace("$API_ROLE", apiMachineRole.roleArn)
        .replace("$MACHINE_ARN", machine.stateMachineArn)
        .replace("$SEARCH_LAMBDA_ARN", searchHandler.functionArn)
        .replace("$LIST_LAMBDA_ARN", listHandler.functionArn)
        .replace("$GET_LAMBDA_ARN", getHandler.functionArn)
    );

    cfnApi.addPropertyOverride("Body", newBody);
    cfnApi.addPropertyDeletionOverride("Name");
    cfnApi.addPropertyDeletionOverride("ProtocolType");

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.apiEndpoint
    });
    new cdk.CfnOutput(this, "machineArn", {
      value: machine.stateMachineArn
    });
    new cdk.CfnOutput(this, "startMachineRoleArn", {
      value: apiMachineRole.roleArn
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};

const app = new cdk.App();

new MyStack(app, "openapi-api", { env: devEnv });

app.synth();
