import { useState } from 'react';
import { Table, Tag, Button, Space, Popconfirm, Image, Tooltip, Badge, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, AndroidOutlined, GlobalOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { AppItem, appApi } from '../api/services';
import VersionManager from './VersionManager';

interface Props {
  apps: AppItem[];
  loading: boolean;
  onEdit: (app: AppItem) => void;
  onRefresh: () => void;
}

export default function AppList({ apps, loading, onEdit, onRefresh }: Props) {
  const [versionModal, setVersionModal] = useState<{ open: boolean; appId?: string; appName?: string }>({ open: false });

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除该应用吗？',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await appApi.delete(id);
        message.success('删除成功');
        onRefresh();
      },
    });
  };

  const showVersions = (app: AppItem) => {
    setVersionModal({ open: true, appId: app.id, appName: app.name });
  };

  const columns: ColumnsType<AppItem> = [
    {
      title: '应用',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <Image
            src={record.icon_url}
            alt={name}
            width={44}
            height={44}
            style={{ borderRadius: 10, objectFit: 'cover' }}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Crect fill='%23f0f0f0' width='44' height='44'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3E%E6%97%A0%E5%9B%BE%3C/text%3E%3C/svg%3E"
            preview={false}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            {record.description && (
              <div style={{ fontSize: 12, color: '#999', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {record.description}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'APK' ? 'green' : 'blue'} icon={type === 'APK' ? <AndroidOutlined /> : <GlobalOutlined />}>
          {type}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (cat: string) => <Tag>{cat}</Tag>,
    },
    {
      title: '版本',
      key: 'version',
      width: 150,
      render: (_, record) => {
        if (record.type === 'APK') {
          return record.version_name ? (
            <Tooltip title={`版本号: ${record.version_code} | 包名: ${record.package_name || '未知'}`}>
              <Tag color="processing">v{record.version_name}</Tag>
            </Tooltip>
          ) : <span style={{ color: '#ccc' }}>未上传</span>;
        }
        return record.web_url ? (
          <Tooltip title={record.web_url}>
            <Tag color="blue">{record.display_mode === 'webview' ? '内置WebView' : '外部浏览器'}</Tag>
          </Tooltip>
        ) : <span style={{ color: '#ccc' }}>未配置</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Badge status={status === 'online' ? 'success' : 'error'} text={status === 'online' ? '上架' : '下架'} />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="版本管理">
            <Button size="small" icon={<HistoryOutlined />} onClick={() => showVersions(record)} />
          </Tooltip>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该应用？相关版本也会一并删除。" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={apps}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        scroll={{ x: 1000 }}
      />

      {versionModal.appId && (
        <VersionManager
          open={versionModal.open}
          appId={versionModal.appId}
          appName={versionModal.appName || ''}
          onClose={() => setVersionModal({ open: false })}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}
