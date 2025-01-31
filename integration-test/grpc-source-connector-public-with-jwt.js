import grpc from 'k6/net/grpc';
import http from "k6/http";
import {
    sleep,
    check,
    group
} from "k6";
import {
    randomString
} from "https://jslib.k6.io/k6-utils/1.1.0/index.js";

import * as constant from "./const.js"
import * as helper from "./helper.js"

const client = new grpc.Client();
client.load(['proto/vdp/connector/v1alpha'], 'connector_public_service.proto');

export function CheckCreate() {

    group(`Connector API: Create source connector [with random "jwt-sub" header]`, () => {
        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        var httpSrcConnector = {
            "id": "source-http",
            "connector_definition_name": constant.httpSrcDefRscName,
            "description": "HTTP source",
            "configuration": {},
        }

        var gRPCSrcConnector = {
            "id": "source-grpc",
            "connector_definition_name": constant.gRPCSrcDefRscName,
            "description": "gRPC source",
            "configuration": {},
        }

        // Cannot create source connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/CreateConnector', {
            connector: httpSrcConnector
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/CreateConnector create HTTP source response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        // Cannot create source connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/CreateConnector', {
            connector: gRPCSrcConnector
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/CreateConnector create gRPC source response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        client.close();
    });
}

export function CheckList() {

    group(`Connector API: List source connectors [with random "jwt-sub" header]`, () => {
        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        // Cannot list source connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ListConnectors', {
            filter: "connector_type=CONNECTOR_TYPE_SOURCE",
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/ListConnectors response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        client.close();
    });
}

export function CheckGet() {

    group(`Connector API: Get source connectors by ID [with random "jwt-sub" header]`, () => {
        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        var httpSrcConnector = {
            "id": "source-http",
            "connector_definition_name": constant.httpSrcDefRscName,
            "configuration": {}
        }

        var resHTTP = client.invoke('vdp.connector.v1alpha.ConnectorPublicService/CreateConnector', {
            connector: httpSrcConnector
        })

        // Cannot get source connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/GetConnector', {
            name: `connectors/${resHTTP.message.connector.id}`
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/GetConnector name=connectors/${resHTTP.message.connector.id} response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        check(client.invoke(`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector`, {
            name: `connectors/${resHTTP.message.connector.id}`
        }), {
            [`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector ${resHTTP.message.connector.id} response StatusOK`]: (r) => r.status === grpc.StatusOK,
        });

        client.close();
    });
}

export function CheckUpdate() {

    group(`Connector API: Update source connectors [with random "jwt-sub" header]`, () => {

        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        var gRPCSrcConnector = {
            "id": "source-grpc",
            "connector_definition_name": constant.gRPCSrcDefRscName,
            "configuration": {}
        }

        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/CreateConnector', {
            connector: gRPCSrcConnector
        }), {
            "vdp.connector.v1alpha.ConnectorPublicService/CreateConnector response CreateConnector StatusOK": (r) => r.status === grpc.StatusOK,
        });

        gRPCSrcConnector.description = randomString(20)

        // Cannot update source connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/UpdateConnector', {
            connector: gRPCSrcConnector
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/UpdateConnector ${gRPCSrcConnector.id} response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        check(client.invoke(`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector`, {
            name: `connectors/${gRPCSrcConnector.id}`
        }), {
            [`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector ${gRPCSrcConnector.id} response StatusOK`]: (r) => r.status === grpc.StatusOK,
        });

        client.close();
    });

}

export function CheckDelete() {

    group(`Connector API: Delete source connectors [with random "jwt-sub" header]`, () => {

        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        // Cannot delete source connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector', {
            name: `connectors/source-http`
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector source-http response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        // Cannot delete destination connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector', {
            name: `connectors/destination-http`
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector destination-http response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        client.close();
    });
}

export function CheckLookUp() {

    group(`Connector API: Look up source connectors by UID [with random "jwt-sub" header]`, () => {

        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        var httpSrcConnector = {
            "id": "source-http",
            "connector_definition_name": constant.httpSrcDefRscName,
            "configuration": {}
        }

        var resHTTP = client.invoke('vdp.connector.v1alpha.ConnectorPublicService/CreateConnector', {
            connector: httpSrcConnector
        })

        // Cannot look up source connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/LookUpConnector', {
            permalink: `connectors/${resHTTP.message.connector.uid}`
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/LookUpConnector permalink=connectors/${resHTTP.message.connector.uid} response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        check(client.invoke(`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector`, {
            name: `connectors/source-http`
        }), {
            [`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector source-http response StatusOK`]: (r) => r.status === grpc.StatusOK,
        });

        client.close();
    });
}

export function CheckState() {

    group(`Connector API: Change state source connectors [with random "jwt-sub" header]`, () => {

        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        var httpSrcConnector = {
            "id": "source-http",
            "connector_definition_name": constant.httpSrcDefRscName,
            "configuration": {}
        }

        var resHTTP = client.invoke('vdp.connector.v1alpha.ConnectorPublicService/CreateConnector', {
            connector: httpSrcConnector
        })

        // Cannot connect source connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/ConnectConnector', {
            name: `connectors/${resHTTP.message.connector.id}`
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/ConnectConnector ${resHTTP.message.connector.id} response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        // Cannot disconnect source connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/DisconnectConnector', {
            name: `connectors/${resHTTP.message.connector.id}`
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/DisconnectConnector ${resHTTP.message.connector.id} response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        check(client.invoke(`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector`, {
            name: `connectors/source-http`
        }), {
            [`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector source-http response StatusOK`]: (r) => r.status === grpc.StatusOK,
        });

        client.close();
    });
}

export function CheckRename() {

    group(`Connector API: Rename source connectors [with random "jwt-sub" header]`, () => {

        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        var httpSrcConnector = {
            "id": "source-http",
            "connector_definition_name": constant.httpSrcDefRscName,
            "configuration": {}
        }

        var resHTTP = client.invoke('vdp.connector.v1alpha.ConnectorPublicService/CreateConnector', {
            connector: httpSrcConnector
        })

        // Cannot rename source connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/RenameConnector', {
            name: `connectors/${resHTTP.message.connector.id}`,
            new_connector_id: "some-id-not-http"
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/RenameConnector ${resHTTP.message.connector.id} response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        check(client.invoke(`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector`, {
            name: `connectors/source-http`
        }), {
            [`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector source-http response StatusOK`]: (r) => r.status === grpc.StatusOK,
        });

        client.close();
    });
}

export function CheckTest() {

    group(`Connector API: Test source connectors by ID [with random "jwt-sub" header]`, () => {
        client.connect(constant.connectorGRPCPublicHost, {
            plaintext: true
        });

        var httpSrcConnector = {
            "id": "source-http",
            "connector_definition_name": constant.httpSrcDefRscName,
            "configuration": {}
        }

        var resHTTP = client.invoke('vdp.connector.v1alpha.ConnectorPublicService/CreateConnector', {
            connector: httpSrcConnector
        })

        // Cannot test connector of a non-exist user
        check(client.invoke('vdp.connector.v1alpha.ConnectorPublicService/TestConnector', {
            name: `connectors/${resHTTP.message.connector.id}`
        }, constant.paramsGRPCWithJwt), {
            [`[with random "jwt-sub" header] vdp.connector.v1alpha.ConnectorPublicService/TestConnector name=connectors/${resHTTP.message.connector.id} response StatusNotFound`]: (r) => r.status === grpc.StatusNotFound,
        })

        check(client.invoke(`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector`, {
            name: `connectors/${resHTTP.message.connector.id}`
        }), {
            [`vdp.connector.v1alpha.ConnectorPublicService/DeleteConnector ${resHTTP.message.connector.id} response StatusOK`]: (r) => r.status === grpc.StatusOK,
        });

        client.close();
    });
}
