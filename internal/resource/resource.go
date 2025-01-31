package resource

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/gogo/status"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"

	"github.com/instill-ai/connector-backend/pkg/constant"

	mgmtPB "github.com/instill-ai/protogen-go/base/mgmt/v1alpha"
)

// ExtractFromMetadata extracts context metadata given a key
func ExtractFromMetadata(ctx context.Context, key string) ([]string, bool) {
	data, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return []string{}, false
	}
	return data[strings.ToLower(key)], true
}

// GetRequestSingleHeader get a request header, the header has to be single-value HTTP header
func GetRequestSingleHeader(ctx context.Context, header string) string {
	metaHeader := metadata.ValueFromIncomingContext(ctx, strings.ToLower(header))
	if len(metaHeader) != 1 {
		return ""
	}
	return metaHeader[0]
}

// GetCollectionID returns the resource collection ID given a resource name
func GetCollectionID(name string) (string, error) {
	colID := name[:strings.LastIndex(name, "/")]
	if colID == "" {
		return "", fmt.Errorf("Error when extract resource collection id from resource name %s", name)
	}
	if strings.LastIndex(colID, "/") != -1 {
		colID = colID[strings.LastIndex(colID, "/")+1:]
	}
	return colID, nil
}

// GetRscNameID returns the resource ID given a resource name
func GetRscNameID(name string) (string, error) {
	id := name[strings.LastIndex(name, "/")+1:]
	if id == "" {
		return "", fmt.Errorf("Error when extract resource id from resource name '%s'", name)
	}
	return id, nil
}

// GetPermalinkUID returns the resource UID given a resource permalink
func GetPermalinkUID(permalink string) (string, error) {
	uid := permalink[strings.LastIndex(permalink, "/")+1:]
	if uid == "" {
		return "", fmt.Errorf("Error when extract resource id from resource permalink '%s'", permalink)
	}
	return uid, nil
}

// GetOwner returns the resource owner
func GetOwner(ctx context.Context, client mgmtPB.MgmtPrivateServiceClient) (*mgmtPB.User, error) {
	// Verify if "jwt-sub" is in the header
	headerOwnerUId := GetRequestSingleHeader(ctx, constant.HeaderOwnerUIDKey)
	if headerOwnerUId != "" {
		_, err := uuid.FromString(headerOwnerUId)
		if err != nil {
			return nil, status.Errorf(codes.NotFound, "Not found")
		}
		ownerPermalink := "users/" + headerOwnerUId

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		resp, err := client.LookUpUserAdmin(ctx, &mgmtPB.LookUpUserAdminRequest{Permalink: ownerPermalink})
		if err != nil {
			return nil, status.Errorf(codes.NotFound, "Not found")
		}

		return resp.User, nil
	}

	// Verify "owner-id" in the header if there is no "jwt-sub"
	headerOwnerId := GetRequestSingleHeader(ctx, constant.HeaderOwnerIDKey)
	if headerOwnerId == "" {
		return nil, status.Errorf(codes.Unauthenticated, "Unauthorized")
	}

	// Get the permalink from management backend from resource name
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	resp, err := client.GetUserAdmin(ctx, &mgmtPB.GetUserAdminRequest{Name: "users/" + headerOwnerId})
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "Not found")
	}
	return resp.User, nil
}
