import http from "k6/http";
import {
    check,
    group
} from "k6";

import {
    connectorPublicHost,
    connectorPrivateHost
} from "./const.js"

import * as constant from "./const.js"
import * as helper from "./helper.js"

export function CheckList() {

    group("Connector API: List source connectors by admin", () => {

        check(http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?filter=connector_type=CONNECTOR_TYPE_SOURCE`), {
            [`GET /v1alpha/admin/connectors response status is 200`]: (r) => r.status === 200,
            [`GET /v1alpha/admin/connectors response connectors array is 0 length`]: (r) => r.json().connectors.length === 0,
            [`GET /v1alpha/admin/connectors response next_page_token is empty`]: (r) => r.json().next_page_token === "",
            [`GET /v1alpha/admin/connectors response total_size is 0`]: (r) => r.json().next_page_token == 0,
        });

        var reqBodies = [];
        reqBodies[0] = {
            "id": "source-http",
            "connector_definition_name": constant.httpSrcDefRscName,
            "configuration": {}

        }

        reqBodies[1] = {
            "id": "source-grpc",
            "connector_definition_name": constant.gRPCSrcDefRscName,
            "configuration": {}

        }

        // Create connectors
        for (const reqBody of reqBodies) {
            check(http.request(
                "POST",
                `${connectorPublicHost}/v1alpha/connectors`,
                JSON.stringify(reqBody), constant.params), {
                [`POST /v1alpha/connectors x${reqBodies.length} response status 201`]: (r) => r.status === 201,
            });
        }

        check(http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?filter=connector_type=CONNECTOR_TYPE_SOURCE`), {
            [`GET /v1alpha/admin/connectors response status is 200`]: (r) => r.status === 200,
            [`GET /v1alpha/admin/connectors response has connectors array`]: (r) => Array.isArray(r.json().connectors),
            [`GET /v1alpha/admin/connectors response has total_size = ${reqBodies.length}`]: (r) => r.json().total_size == reqBodies.length,
        });

        var limitedRecords = http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?filter=connector_type=CONNECTOR_TYPE_SOURCE`)
        check(http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?filter=connector_type=CONNECTOR_TYPE_SOURCE&page_size=0`), {
            "GET /v1alpha/admin/connectors?page_size=0 response status is 200": (r) => r.status === 200,
            "GET /v1alpha/admin/connectors?page_size=0 response all records": (r) => r.json().connectors.length === limitedRecords.json().connectors.length,
        });

        check(http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?filter=connector_type=CONNECTOR_TYPE_SOURCE&page_size=1`), {
            "GET /v1alpha/admin/connectors?page_size=1 response status is 200": (r) => r.status === 200,
            "GET /v1alpha/admin/connectors?page_size=1 response connectors size 1": (r) => r.json().connectors.length === 1,
        });

        var pageRes = http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?filter=connector_type=CONNECTOR_TYPE_SOURCE&page_size=1`)
        check(http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?page_size=1&page_token=${pageRes.json().next_page_token}`), {
            [`GET /v1alpha/admin/connectors?page_size=1&page_token=${pageRes.json().next_page_token} response status is 200`]: (r) => r.status === 200,
            [`GET /v1alpha/admin/connectors?page_size=1&page_token=${pageRes.json().next_page_token} response connectors size 1`]: (r) => r.json().connectors.length === 1,
        });

        check(http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?filter=connector_type=CONNECTOR_TYPE_SOURCE&page_size=1&view=VIEW_BASIC`), {
            "GET /v1alpha/admin/connectors?page_size=1&view=VIEW_BASIC response status 200": (r) => r.status === 200,
            "GET /v1alpha/admin/connectors?page_size=1&view=VIEW_BASIC response connectors[0].configuration is null": (r) => r.json().connectors[0].configuration === null,
            "GET /v1alpha/admin/connectors?page_size=1&view=VIEW_BASIC response connectors[0].owner is UUID": (r) => helper.isValidOwner(r.json().connectors[0].user),
        });

        check(http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?filter=connector_type=CONNECTOR_TYPE_SOURCE&page_size=1&view=VIEW_FULL`), {
            "GET /v1alpha/admin/connectors?page_size=1&view=VIEW_FULL response status 200": (r) => r.status === 200,
            "GET /v1alpha/admin/connectors?page_size=1&view=VIEW_FULL response connectors[0]configuration is not null": (r) => r.json().connectors[0].configuration !== null,
            "GET /v1alpha/admin/connectors?page_size=1&view=VIEW_FULL response connectors[0]connector_definition_detail is not null": (r) => r.json().connectors[0].connector_definition_detail !== null,
            "GET /v1alpha/admin/connectors?page_size=1&view=VIEW_FULL response connectors[0]configuration is {}": (r) => Object.keys(r.json().connectors[0].configuration).length === 0,
            "GET /v1alpha/admin/connectors?page_size=1&view=VIEW_FULL response connectors[0]connector.owner is UUID": (r) => helper.isValidOwner(r.json().connectors[0].user),
        });

        check(http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?filter=connector_type=CONNECTOR_TYPE_SOURCE&page_size=1`), {
            "GET /v1alpha/admin/connectors?page_size=1 response status 200": (r) => r.status === 200,
            "GET /v1alpha/admin/connectors?page_size=1 response connectors[0]configuration is null": (r) => r.json().connectors[0].configuration === null,
            "GET /v1alpha/admin/connectors?page_size=1 response connectors[0]connector.owner is UUID": (r) => helper.isValidOwner(r.json().connectors[0].user),
        });

        check(http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors?filter=connector_type=CONNECTOR_TYPE_SOURCE&page_size=${limitedRecords.json().total_size}`), {
            [`GET /v1alpha/admin/connectors?page_size=${limitedRecords.json().total_size} response status 200`]: (r) => r.status === 200,
            [`GET /v1alpha/admin/connectors?page_size=${limitedRecords.json().total_size} response next_page_token is empty`]: (r) => r.json().next_page_token === ""
        });

        // Delete the destination connectors
        for (const reqBody of reqBodies) {
            check(http.request("DELETE", `${connectorPublicHost}/v1alpha/connectors/${reqBody.id}`), {
                [`DELETE /v1alpha/admin/connectors x${reqBodies.length} response status is 204`]: (r) => r.status === 204,
            });
        }
    });
}

export function CheckLookUp() {

    group("Connector API: Look up source connectors by UID by admin", () => {

        var httpSrcConnector = {
            "id": "source-http",
            "connector_definition_name": constant.httpSrcDefRscName,
            "configuration": {}

        }

        var resHTTP = http.request("POST", `${connectorPublicHost}/v1alpha/connectors`,
            JSON.stringify(httpSrcConnector), constant.params)

        check(http.request("GET", `${connectorPrivateHost}/v1alpha/admin/connectors/${resHTTP.json().connector.uid}/lookUp`), {
            [`GET /v1alpha/admin/connectors/${resHTTP.json().uid}/lookUp response status 200`]: (r) => r.status === 200,
            [`GET /v1alpha/admin/connectors/${resHTTP.json().uid}/lookUp response connector uid`]: (r) => r.json().connector.uid === resHTTP.json().connector.uid,
            [`GET /v1alpha/admin/connectors/${resHTTP.json().uid}/lookUp response connector connector_definition_name`]: (r) => r.json().connector.connector_definition_name === constant.httpSrcDefRscName,
            [`GET /v1alpha/admin/connectors/${resHTTP.json().uid}/lookUp response connector owner is UUID`]: (r) => helper.isValidOwner(r.json().connector.user),
        });

        check(http.request("DELETE", `${connectorPublicHost}/v1alpha/connectors/${resHTTP.json().connector.id}`), {
            [`DELETE /v1alpha/admin/connectors/${resHTTP.json().connector.id} response status 204`]: (r) => r.status === 204,
        });

    });
}
