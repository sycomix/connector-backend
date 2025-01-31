import grpc from 'k6/net/grpc';
import {
    check,
    group
} from "k6";

import * as constant from "./const.js"

import {
    deepEqual
} from "./helper.js"

const client = new grpc.Client();
client.load(['proto/vdp/connector/v1alpha'], 'connector_public_service.proto');

export function CheckList() {

    group("Connector API: List source connector definitions", () => {

        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions response connectorDefinitions array`]: (r) => Array.isArray(r.message.connectorDefinitions),
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions response totalSize > 0`]: (r) => r.message.totalSize > 0,
        });

        var limitedRecords = client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
        }, {})
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
            pageSize: 0
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=0 response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=0 response connectorDefinitions length = 1`]: (r) => r.message.connectorDefinitions.length === limitedRecords.message.connectorDefinitions.length,
        });

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
            pageSize: 1
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=1 response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=1 response connectorDefinitions length = 1`]: (r) => r.message.connectorDefinitions.length === 1,
        });

        var pageRes = client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
            pageSize: 1
        }, {})
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
            pageSize: 1,
            pageToken: pageRes.message.nextPageToken
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=1 pageToken=${pageRes.message.nextPageToken} response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=1 pageToken=${pageRes.message.nextPageToken} response connectorDefinitions length = 1`]: (r) => r.message.connectorDefinitions.length === 1,
        });

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
            pageSize: 1,
            view: "VIEW_BASIC"
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=1 view=VIEW_BASIC response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=1 view=VIEW_BASIC response connectorDefinitions connectorDefinition spec is null`]: (r) => r.message.connectorDefinitions[0].spec === null,
        });

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
            pageSize: 1,
            view: "VIEW_FULL"
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=1 view=VIEW_FULL response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=1 view=VIEW_FULL response connectorDefinitions connectorDefinition spec is not null`]: (r) => r.message.connectorDefinitions[0].spec !== null,
        });

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
            pageSize: 1,
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=1 response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=1 response connectorDefinitions connectorDefinition spec is null`]: (r) => r.message.connectorDefinitions[0].spec === null,
        });

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
            pageSize: limitedRecords.message.totalSize,
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=${limitedRecords.message.totalSize} response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions pageSize=${limitedRecords.message.totalSize} response nextPageToken is null`]: (r) => r.message.nextPageToken === "",
        });

        client.close();
    });
}

export function CheckGet() {
    group("Connector API: Get source connector definition", () => {
        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        var allRes = client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectorDefinitions', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
        }, {})
        var def = allRes.message.connectorDefinitions[0]

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition', {
            name: `connector-definitions/${def.id}`
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition id=${def.id}} response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition id=${def.id} response has the exact record`]: (r) => deepEqual(r.message.connectorDefinition, def),
            [`vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition id=${def.id} has the non-empty resource name ${def.name}`]: (r) => r.message.connectorDefinition.name != "",
            [`vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition id=${def.id} has the resource name ${def.name}`]: (r) => r.message.connectorDefinition.name === def.name,
        });

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition', {
            name: `connector-definitions/${def.id}`,
            view: "VIEW_BASIC"
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition id=${def.id}} view=VIEW_BASIC response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition id=${def.id} view=VIEW_BASIC response connectorDefinition.spec is null`]: (r) => r.message.connectorDefinition.spec === null,
        });

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition', {
            name: `connector-definitions/${def.id}`,
            view: "VIEW_FULL"
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition id=${def.id}} view=VIEW_FULL response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition id=${def.id} view=VIEW_FULL response connectorDefinition.spec is not null`]: (r) => r.message.connectorDefinition.spec !== null,
        });

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition', {
            name: `connector-definitions/${def.id}`,
        }, {}), {
            [`vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition id=${def.id}} response StatusOK`]: (r) => r.status === grpc.StatusOK,
            [`vdp.connector.v1alpha.ConnectorPublicService/GetConnectorDefinition id=${def.id} response connectorDefinition.spec is null`]: (r) => r.message.connectorDefinition.spec === null,
        });

        client.close();
    });
}
