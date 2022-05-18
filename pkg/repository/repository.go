package repository

import (
	"time"

	"google.golang.org/grpc/codes"
	"gorm.io/gorm"

	"github.com/gofrs/uuid"
	"github.com/gogo/status"
	"github.com/instill-ai/connector-backend/pkg/datamodel"
	"github.com/instill-ai/x/paginate"

	connectorPB "github.com/instill-ai/protogen-go/connector/v1alpha"
)

// Repository interface
type Repository interface {
	// ConnectorDefinition
	ListConnectorDefinition(connectorType datamodel.ConnectorType, pageSize int64, pageToken string, isBasicView bool) ([]*datamodel.ConnectorDefinition, int64, string, error)
	GetConnectorDefinitionByID(id string, connectorType datamodel.ConnectorType, isBasicView bool) (*datamodel.ConnectorDefinition, error)
	GetConnectorDefinitionByUID(uid uuid.UUID, isBasicView bool) (*datamodel.ConnectorDefinition, error)

	// Connector
	CreateConnector(connector *datamodel.Connector) error
	ListConnector(owner string, connectorType datamodel.ConnectorType, pageSize int64, pageToken string, isBasicView bool) ([]*datamodel.Connector, int64, string, error)
	GetConnectorByID(id string, owner string, connectorType datamodel.ConnectorType, isBasicView bool) (*datamodel.Connector, error)
	GetConnectorByUID(uuid uuid.UUID, owner string, connectorType datamodel.ConnectorType, isBasicView bool) (*datamodel.Connector, error)
	UpdateConnector(id string, owner string, connectorType datamodel.ConnectorType, connector *datamodel.Connector) error
	DeleteConnector(id string, owner string, connectorType datamodel.ConnectorType) error
	UpdateConnectorID(id string, owner string, connectorType datamodel.ConnectorType, newID string) error
}

type repository struct {
	db *gorm.DB
}

// NewRepository initiates a repository instance
func NewRepository(db *gorm.DB) Repository {
	return &repository{
		db: db,
	}
}

func (r *repository) ListConnectorDefinition(connectorType datamodel.ConnectorType, pageSize int64, pageToken string, isBasicView bool) (connectorDefinitions []*datamodel.ConnectorDefinition, totalSize int64, nextPageToken string, err error) {

	r.db.Model(&datamodel.ConnectorDefinition{}).Where("connector_type = ?", connectorType).Count(&totalSize)

	queryBuilder := r.db.Model(&datamodel.ConnectorDefinition{}).Order("create_time DESC, uid DESC").Where("connector_type = ?", connectorType)

	if pageSize == 0 {
		pageSize = 10
	} else if pageSize > 100 {
		pageSize = 100
	}

	queryBuilder = queryBuilder.Limit(int(pageSize))

	if pageToken != "" {
		createdAt, uid, err := paginate.DecodeToken(pageToken)
		if err != nil {
			return nil, 0, "", status.Errorf(codes.InvalidArgument, "Invalid page token: %s", err.Error())
		}
		queryBuilder = queryBuilder.Where("(create_time,uid) < (?::timestamp, ?)", createdAt, uid)
	}

	if isBasicView {
		queryBuilder.Omit("spec")
	}

	// only using one for all loops, we only need the latest one in the end
	var createTime time.Time
	rows, err := queryBuilder.Rows()
	if err != nil {
		return nil, 0, "", status.Errorf(codes.Internal, err.Error())
	}
	defer rows.Close()
	for rows.Next() {
		var item datamodel.ConnectorDefinition
		if err = r.db.ScanRows(rows, &item); err != nil {
			return nil, 0, "", status.Errorf(codes.Internal, err.Error())
		}
		createTime = item.CreateTime
		connectorDefinitions = append(connectorDefinitions, &item)
	}

	if len(connectorDefinitions) < int(pageSize) {
		return connectorDefinitions, totalSize, "", nil
	}
	if len(connectorDefinitions) > 0 {
		lastUID := (connectorDefinitions)[len(connectorDefinitions)-1].UID
		lastItem := &datamodel.ConnectorDefinition{}
		if result := r.db.Model(&datamodel.ConnectorDefinition{}).
			Where("connector_type = ?", connectorType).
			Order("create_time ASC, uid ASC").Limit(1).Find(lastItem); result.Error != nil {
			return nil, 0, "", status.Errorf(codes.Internal, result.Error.Error())
		}
		if lastItem.UID.String() == lastUID.String() {
			nextPageToken = ""
		} else {
			nextPageToken = paginate.EncodeToken(createTime, lastUID.String())
		}
	}

	return connectorDefinitions, totalSize, nextPageToken, nil

}

func (r *repository) GetConnectorDefinitionByID(id string, connectorType datamodel.ConnectorType, isBasicView bool) (*datamodel.ConnectorDefinition, error) {
	var connectorDefinition datamodel.ConnectorDefinition
	queryBuilder := r.db.Model(&datamodel.ConnectorDefinition{}).Where("id = ? AND connector_type = ?", id, connectorType)
	if isBasicView {
		queryBuilder.Omit("spec")
	}
	if result := queryBuilder.First(&connectorDefinition); result.Error != nil {
		return nil, status.Errorf(codes.NotFound, "The connector with connector_type `%s` and id `%s` you specified is not found", connectorPB.ConnectorType(connectorType), id)
	}
	return &connectorDefinition, nil
}

func (r *repository) GetConnectorDefinitionByUID(uid uuid.UUID, isBasicView bool) (*datamodel.ConnectorDefinition, error) {
	var connectorDefinition datamodel.ConnectorDefinition
	queryBuilder := r.db.Model(&datamodel.ConnectorDefinition{}).Where("uid = ?", uid)
	if isBasicView {
		queryBuilder.Omit("spec")
	}
	if result := queryBuilder.First(&connectorDefinition); result.Error != nil {
		return nil, status.Errorf(codes.NotFound, "The connector with uid `%s` you specified is not found", uid)
	}
	return &connectorDefinition, nil
}

func (r *repository) CreateConnector(connector *datamodel.Connector) error {
	if result := r.db.Model(&datamodel.Connector{}).Create(connector); result.Error != nil {
		return status.Errorf(codes.Internal, result.Error.Error())
	}
	return nil
}

func (r *repository) ListConnector(owner string, connectorType datamodel.ConnectorType, pageSize int64, pageToken string, isBasicView bool) (connectors []*datamodel.Connector, totalSize int64, nextPageToken string, err error) {

	r.db.Model(&datamodel.Connector{}).Where("owner = ? AND connector_type = ?", owner, connectorType).Count(&totalSize)

	queryBuilder := r.db.Model(&datamodel.Connector{}).Order("create_time DESC, uid DESC").Where("owner = ? AND connector_type = ?", owner, connectorType)

	if pageSize == 0 {
		pageSize = 10
	} else if pageSize > 100 {
		pageSize = 100
	}

	queryBuilder = queryBuilder.Limit(int(pageSize))

	if pageToken != "" {
		createdAt, uid, err := paginate.DecodeToken(pageToken)
		if err != nil {
			return nil, 0, "", status.Errorf(codes.InvalidArgument, "Invalid page token: %s", err.Error())
		}
		queryBuilder = queryBuilder.Where("(create_time,uid) < (?::timestamp, ?)", createdAt, uid)
	}

	if isBasicView {
		queryBuilder.Omit("configuration")
	}

	var createTime time.Time // only using one for all loops, we only need the latest one in the end
	rows, err := queryBuilder.Rows()
	if err != nil {
		return nil, 0, "", status.Errorf(codes.Internal, err.Error())
	}
	defer rows.Close()
	for rows.Next() {
		var item datamodel.Connector
		if err = r.db.ScanRows(rows, &item); err != nil {
			return nil, 0, "", status.Errorf(codes.Internal, err.Error())
		}
		createTime = item.CreateTime
		connectors = append(connectors, &item)
	}

	if len(connectors) > 0 {
		lastUID := (connectors)[len(connectors)-1].UID
		lastItem := &datamodel.Connector{}
		if result := r.db.Model(&datamodel.Connector{}).
			Where("owner = ? AND connector_type = ?", owner, connectorType).
			Order("create_time ASC, uid ASC").Limit(1).Find(lastItem); result.Error != nil {
			return nil, 0, "", status.Errorf(codes.Internal, result.Error.Error())
		}
		if lastItem.UID.String() == lastUID.String() {
			nextPageToken = ""
		} else {
			nextPageToken = paginate.EncodeToken(createTime, lastUID.String())
		}
	}

	return connectors, totalSize, nextPageToken, nil
}

func (r *repository) GetConnectorByID(id string, owner string, connectorType datamodel.ConnectorType, isBasicView bool) (*datamodel.Connector, error) {
	var connector datamodel.Connector

	queryBuilder := r.db.Model(&datamodel.Connector{}).
		Where("id = ? AND owner = ? AND connector_type = ?", id, owner, connectorType)

	if isBasicView {
		queryBuilder.Omit("configuration")
	}

	if result := queryBuilder.First(&connector); result.Error != nil {
		return nil, status.Errorf(codes.NotFound, "The connector with connector_type `%s` and id `%s` you specified is not found", connectorPB.ConnectorType(connectorType), id)
	}
	return &connector, nil
}

func (r *repository) GetConnectorByUID(uid uuid.UUID, owner string, connectorType datamodel.ConnectorType, isBasicView bool) (*datamodel.Connector, error) {
	var connector datamodel.Connector

	queryBuilder := r.db.Model(&datamodel.Connector{}).
		Where("uid = ? AND owner = ? AND connector_type = ?", uid, owner, connectorType)

	if isBasicView {
		queryBuilder.Omit("configuration")
	}

	if result := queryBuilder.First(&connector); result.Error != nil {
		return nil, status.Errorf(codes.NotFound, "The connector with connector_type `%s` and uid `%s` you specified is not found", connectorPB.ConnectorType(connectorType), uid)
	}
	return &connector, nil
}

func (r *repository) UpdateConnector(id string, owner string, connectorType datamodel.ConnectorType, connector *datamodel.Connector) error {
	if result := r.db.Model(&datamodel.Connector{}).
		Where("id = ? AND owner = ? AND connector_type = ?", id, owner, connectorType).
		Updates(connector); result.Error != nil {
		return status.Errorf(codes.Internal, result.Error.Error())
	}
	return nil
}

func (r *repository) DeleteConnector(id string, owner string, connectorType datamodel.ConnectorType) error {

	result := r.db.Model(&datamodel.Connector{}).
		Where("id = ? AND owner = ? AND connector_type = ?", id, owner, connectorType).
		Delete(&datamodel.Connector{})

	if result.Error != nil {
		return status.Error(codes.Internal, result.Error.Error())
	}

	if result.RowsAffected == 0 {
		return status.Errorf(codes.NotFound, "The connector with connector_type `%s` and id `%s` you specified is not found", connectorPB.ConnectorType(connectorType), id)
	}

	return nil
}

func (r *repository) UpdateConnectorID(id string, owner string, connectorType datamodel.ConnectorType, newID string) error {
	if result := r.db.Model(&datamodel.Connector{}).
		Where("id = ? AND owner = ? AND connector_type = ?", id, owner, connectorType).
		Update("id", newID); result.Error != nil {
		return status.Errorf(codes.Internal, result.Error.Error())
	}
	return nil
}
