import http from "k6/http";
import { check, group } from "k6";

import { connectorPublicHost } from "./const.js"
import { deepEqual } from "./helper.js"

export function CheckList() {

    group("Connector API: List destination connector definitions", () => {

        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions`), {
            "GET /v1alpha/connector-definitions response status is 200": (r) => r.status === 200,
            "GET /v1alpha/connector-definitions response has connector_definitions array": (r) => Array.isArray(r.json().connector_definitions),
            "GET /v1alpha/connector-definitions response total_size > 0": (r) => r.json().total_size > 0
        });

        var limitedRecords = http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions`)
        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions?page_size=0`), {
            "GET /v1alpha/connector-definitions?page_size=0 response status is 200": (r) => r.status === 200,
            "GET /v1alpha/connector-definitions?page_size=0 response limited records for 10": (r) => r.json().connector_definitions.length === limitedRecords.json().connector_definitions.length,
        });

        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions?page_size=1`), {
            "GET /v1alpha/connector-definitions?page_size=1 response status is 200": (r) => r.status === 200,
            "GET /v1alpha/connector-definitions?page_size=1 response connector_definitions size 1": (r) => r.json().connector_definitions.length === 1,
        });

        var pageRes = http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions?page_size=1`)
        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions?page_size=1&page_token=${pageRes.json().next_page_token}`), {
            [`GET /v1alpha/connector-definitions?page_size=1&page_token=${pageRes.json().next_page_token} response status is 200`]: (r) => r.status === 200,
            [`GET /v1alpha/connector-definitions?page_size=1&page_token=${pageRes.json().next_page_token} response connector_definitions size 1`]: (r) => r.json().connector_definitions.length === 1,
        });

        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions?page_size=1&view=VIEW_BASIC`), {
            "GET /v1alpha/connector-definitions?page_size=1&view=VIEW_BASIC response status 200": (r) => r.status === 200,
            "GET /v1alpha/connector-definitions?page_size=1&view=VIEW_BASIC response connector_definitions[0].spec is null": (r) => r.json().connector_definitions[0].spec === null,
        });

        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions?page_size=1&view=VIEW_FULL`), {
            "GET /v1alpha/connector-definitions?page_size=1&view=VIEW_FULL response status 200": (r) => r.status === 200,
            "GET /v1alpha/connector-definitions?page_size=1&view=VIEW_FULL response connector_definitions[0].spec is not null": (r) => r.json().connector_definitions[0].spec !== null,
        });

        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions?page_size=1`), {
            "GET /v1alpha/connector-definitions?page_size=1 response status 200": (r) => r.status === 200,
            "GET /v1alpha/connector-definitions?page_size=1 response connector_definitions[0].spec is null": (r) => r.json().connector_definitions[0].spec === null,
        });

        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions?page_size=${limitedRecords.json().total_size}`), {
            [`GET /v1alpha/connector-definitions?page_size=${limitedRecords.json().total_size} response status 200`]: (r) => r.status === 200,
            [`GET /v1alpha/connector-definitions?page_size=${limitedRecords.json().total_size} response next_page_token is empty`]: (r) => r.json().next_page_token === "",
        });
    });
}

export function CheckGet() {
    group("Connector API: Get destination connector definition", () => {
        var allRes = http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions`)
        var def = allRes.json().connector_definitions[0]
        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions/${def.id}`), {
            [`GET /v1alpha/connector-definitions/${def.id} response status is 200`]: (r) => r.status === 200,
            [`GET /v1alpha/connector-definitions/${def.id} response has the exact record`]: (r) => deepEqual(r.json().connector_definition, def),
            [`GET /v1alpha/connector-definitions/${def.id} response has the non-empty resource name ${def.name}`]: (r) => r.json().connector_definition.name != "",
            [`GET /v1alpha/connector-definitions/${def.id} response has the resource name ${def.name}`]: (r) => r.json().connector_definition.name === def.name,
        });

        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions/${def.id}?view=VIEW_BASIC`), {
            [`GET /v1alpha/connector-definitions/${def.id}?view=VIEW_BASIC response status 200`]: (r) => r.status === 200,
            [`GET /v1alpha/connector-definitions/${def.id}?view=VIEW_BASIC response connector_definition.spec is null`]: (r) => r.json().connector_definition.spec === null,
        });

        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions/${def.id}?view=VIEW_FULL`), {
            [`GET /v1alpha/connector-definitions/${def.id}?view=VIEW_FULL response status 200`]: (r) => r.status === 200,
            [`GET /v1alpha/connector-definitions/${def.id}?view=VIEW_FULL response connector_definition.spec is not null`]: (r) => r.json().connector_definition.spec !== null,
        });

        check(http.request("GET", `${connectorPublicHost}/v1alpha/connector-definitions/${def.id}`), {
            [`GET /v1alpha/connector-definitions/${def.id} response status 200`]: (r) => r.status === 200,
            [`GET /v1alpha/connector-definitions/${def.id} response connector_definition.spec is null`]: (r) => r.json().connector_definition.spec === null,
        });
    });

}
