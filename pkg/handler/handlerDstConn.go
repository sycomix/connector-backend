package handler

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"github.com/instill-ai/connector-backend/internal/resource"
	"github.com/instill-ai/connector-backend/pkg/datamodel"
	"github.com/instill-ai/x/checkfield"

	connectorPB "github.com/instill-ai/protogen-go/vdp/connector/v1alpha"
	modelPB "github.com/instill-ai/protogen-go/vdp/model/v1alpha"
)

func (h *handler) CreateDestinationConnector(ctx context.Context, req *connectorPB.CreateDestinationConnectorRequest) (*connectorPB.CreateDestinationConnectorResponse, error) {
	resp, err := h.createConnector(ctx, req)
	if err != nil {
		return resp.(*connectorPB.CreateDestinationConnectorResponse), err
	}

	if err := grpc.SetHeader(ctx, metadata.Pairs("x-http-code", strconv.Itoa(http.StatusCreated))); err != nil {
		return resp.(*connectorPB.CreateDestinationConnectorResponse), err
	}

	return resp.(*connectorPB.CreateDestinationConnectorResponse), nil
}

func (h *handler) ListDestinationConnector(ctx context.Context, req *connectorPB.ListDestinationConnectorRequest) (*connectorPB.ListDestinationConnectorResponse, error) {
	resp, err := h.listConnector(ctx, req)
	return resp.(*connectorPB.ListDestinationConnectorResponse), err
}

func (h *handler) GetDestinationConnector(ctx context.Context, req *connectorPB.GetDestinationConnectorRequest) (*connectorPB.GetDestinationConnectorResponse, error) {
	resp, err := h.getConnector(ctx, req)
	return resp.(*connectorPB.GetDestinationConnectorResponse), err
}

func (h *handler) UpdateDestinationConnector(ctx context.Context, req *connectorPB.UpdateDestinationConnectorRequest) (*connectorPB.UpdateDestinationConnectorResponse, error) {
	resp, err := h.updateConnector(ctx, req)
	return resp.(*connectorPB.UpdateDestinationConnectorResponse), err
}

func (h *handler) DeleteDestinationConnector(ctx context.Context, req *connectorPB.DeleteDestinationConnectorRequest) (*connectorPB.DeleteDestinationConnectorResponse, error) {
	resp, err := h.deleteConnector(ctx, req)
	if err != nil {
		return resp.(*connectorPB.DeleteDestinationConnectorResponse), err
	}

	if err := grpc.SetHeader(ctx, metadata.Pairs("x-http-code", strconv.Itoa(http.StatusNoContent))); err != nil {
		return resp.(*connectorPB.DeleteDestinationConnectorResponse), err
	}
	return resp.(*connectorPB.DeleteDestinationConnectorResponse), nil
}

func (h *handler) LookUpDestinationConnector(ctx context.Context, req *connectorPB.LookUpDestinationConnectorRequest) (*connectorPB.LookUpDestinationConnectorResponse, error) {
	resp, err := h.lookUpConnector(ctx, req)
	return resp.(*connectorPB.LookUpDestinationConnectorResponse), err
}

func (h *handler) ConnectDestinationConnector(ctx context.Context, req *connectorPB.ConnectDestinationConnectorRequest) (*connectorPB.ConnectDestinationConnectorResponse, error) {
	resp, err := h.connectConnector(ctx, req)
	return resp.(*connectorPB.ConnectDestinationConnectorResponse), err
}

func (h *handler) DisconnectDestinationConnector(ctx context.Context, req *connectorPB.DisconnectDestinationConnectorRequest) (*connectorPB.DisconnectDestinationConnectorResponse, error) {
	resp, err := h.disconnectConnector(ctx, req)
	return resp.(*connectorPB.DisconnectDestinationConnectorResponse), err
}

func (h *handler) RenameDestinationConnector(ctx context.Context, req *connectorPB.RenameDestinationConnectorRequest) (*connectorPB.RenameDestinationConnectorResponse, error) {
	resp, err := h.renameConnector(ctx, req)
	return resp.(*connectorPB.RenameDestinationConnectorResponse), err
}

func (h *handler) WriteDestinationConnector(ctx context.Context, req *connectorPB.WriteDestinationConnectorRequest) (*connectorPB.WriteDestinationConnectorResponse, error) {

	resp := &connectorPB.WriteDestinationConnectorResponse{}

	// Return error if REQUIRED fields are not provided in the requested payload
	if err := checkfield.CheckRequiredFields(req, writeDestinationRequiredFields); err != nil {
		return resp, status.Error(codes.InvalidArgument, err.Error())
	}

	dstConnID, err := resource.GetRscNameID(req.GetName())
	if err != nil {
		return resp, err
	}

	ownerRscName, err := resource.GetOwner(ctx)
	if err != nil {
		return resp, err
	}

	var rootFieldName string
	switch req.Task {
	case modelPB.ModelInstance_TASK_UNSPECIFIED:
		rootFieldName = "unspecified_outputs"
	case modelPB.ModelInstance_TASK_CLASSIFICATION:
		rootFieldName = "classification_outputs"
	case modelPB.ModelInstance_TASK_DETECTION:
		rootFieldName = "detection_outputs"
	case modelPB.ModelInstance_TASK_KEYPOINT:
		rootFieldName = "keypoint_outputs"
	}

	batch, ok := req.Data.Fields[rootFieldName]
	if !ok {
		return resp, fmt.Errorf("Task input array is not found in the payload")
	}

	// Validate TaskAirbyteCatalog's JSON schema
	if err := datamodel.ValidateTaskAirbyteCatalog(req.Task, batch); err != nil {
		return resp, status.Error(codes.InvalidArgument, err.Error())
	}

	if err := h.service.WriteDestinationConnector(dstConnID, ownerRscName, req.Task, batch); err != nil {
		return resp, err
	}

	return resp, nil
}
