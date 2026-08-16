import { useState, useEffect } from 'react';
import { Modal, Table, Button, Upload, Input, InputNumber, App as AntdApp, Tag, Space, Popconfirm, Tooltip } from 'antd';
import { InboxOutlined, UploadOutlined, StarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ApkVersion, appApi, fileApi } from '../api/services';

interface Props {
  open: boolean;
  appId: string;
  appName: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function VersionManager({ open, appId, appName, onClose, onRefresh }: Props) {
  const { message } = AntdApp.useApp();
  const [versions, setVersions] = useState<ApkVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    version_code: 1,
    version_name: '1.0.0',
    package_name: '',
    min_sdk: 21,
    changelog: '',
  });
  const [apkUrl, setApkUrl] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res: any = await appApi.getDetail(appId);
      setVersions(res.data.versions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && appId) {
      fetchVersions();
    }
  }, [open, appId]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const res: any = await fileApi.uploadApk(file, (percent) => setUploadProgress(percent));
      setApkUrl(res.data.file_url);
      setFileSize(res.data.file_size);
      // 尝试从文件名解析版本信息
      const versionMatch = file.name.match(/[_-]?v?(\d+\.\d+\.\d+)/i);
      const codeMatch = file.name.match(/[_-]?(\d{3,})/);
      if (versionMatch) {
        setFormData(prev => ({ ...prev, version_name: versionMatch[1] }));
      }
      if (codeMatch) {
        setFormData(prev => ({ ...prev, version_code: parseInt(codeMatch[1]) }));
      }
      message.success('APK 上传成功');
    } catch {
      // 错误已在拦截器处理
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleAddVersion = async () => {
    if (!apkUrl) {
      message.error('请先上传 APK 文件');
      return;
    }
    if (!formData.version_name) {
      message.error('请输入版本名称');
      return;
    }

    try {
      await appApi.addVersion(appId, {
        version_code: formData.version_code,
        version_name: formData.version_name,
        package_name: formData.package_name,
        apk_url: apkUrl,
        file_size: fileSize,
        min_sdk: formData.min_sdk,
        changelog: formData.changelog,
      });
      message.success('版本添加成功');
      setUploadModal(false);
      setApkUrl('');
      setUploadProgress(0);
      fetchVersions();
      onRefresh();
    } catch {
      // 错误已在拦截器处理
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    try {
      await appApi.deleteVersion(appId, versionId);
      message.success('删除成功');
      fetchVersions();
      onRefresh();
    } catch {
      // 错误已处理
    }
  };

  const handleSetLatest = async (versionId: string) => {
    try {
      await appApi.setLatestVersion(appId, versionId);
      message.success('已设为最新版本');
      fetchVersions();
      onRefresh();
    } catch {
      // 错误已处理
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns: ColumnsType<ApkVersion> = [
    {
      title: '版本',
      key: 'version',
      render: (_, record) => (
        <Space>
          <strong>{record.version_name}</strong>
          <Tag>code: {record.version_code}</Tag>
          {record.is_latest === 1 && <Tag color="gold" icon={<StarOutlined />}>最新</Tag>}
        </Space>
      ),
    },
    {
      title: '包名',
      dataIndex: 'package_name',
      key: 'package_name',
      width: 200,
      render: (val: string) => val ? <code style={{ fontSize: 12 }}>{val}</code> : '-',
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (val: number) => formatFileSize(val),
    },
    {
      title: 'MinSDK',
      dataIndex: 'min_sdk',
      key: 'min_sdk',
      width: 80,
    },
    {
      title: '更新说明',
      dataIndex: 'changelog',
      key: 'changelog',
      ellipsis: true,
      render: (val: string) => val ? <Tooltip title={val}>{val}</Tooltip> : '-',
    },
    {
      title: '上传时间',
      dataIndex: 'upload_time',
      key: 'upload_time',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.is_latest === 0 && (
            <Button size="small" type="link" icon={<StarOutlined />} onClick={() => handleSetLatest(record.id)}>
              设为最新
            </Button>
          )}
          <Popconfirm title="确定删除该版本？" onConfirm={() => handleDeleteVersion(record.id)} okText="确认" cancelText="取消">
            <Button size="small" type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={`版本管理 - ${appName}`}
        open={open}
        onCancel={onClose}
        footer={null}
        width={900}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8c8c8c' }}>共 {versions.length} 个版本</span>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModal(true)}>
            上传新版本
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={versions}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Modal>

      <Modal
        title="上传新版本"
        open={uploadModal}
        onCancel={() => { setUploadModal(false); setApkUrl(''); setUploadProgress(0); }}
        onOk={handleAddVersion}
        confirmLoading={uploading}
        width={500}
      >
        <div style={{ marginBottom: 24 }}>
          <Upload.Dragger
            beforeUpload={handleFileUpload}
            showUploadList={false}
            accept=".apk"
            disabled={uploading}
          >
            {apkUrl ? (
              <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid b7eb8f' }}>
                ✅ APK 已上传成功
              </div>
            ) : (
              <div style={{ padding: 20 }}>
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p>点击或拖拽 APK 文件到此处上传</p>
              </div>
            )}
          </Upload.Dragger>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div style={{ marginTop: 8, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#1677ff', transition: 'width 0.3s' }} />
            </div>
          )}
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>版本名称 *</label>
            <Input value={formData.version_name} onChange={(e) => setFormData(prev => ({ ...prev, version_name: e.target.value }))} placeholder="如: 1.0.0" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>版本号 (versionCode) *</label>
            <InputNumber value={formData.version_code} onChange={(val) => setFormData(prev => ({ ...prev, version_code: val || 1 }))} min={1} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>包名</label>
            <Input value={formData.package_name} onChange={(e) => setFormData(prev => ({ ...prev, package_name: e.target.value }))} placeholder="com.example.app" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>最低 SDK 版本</label>
            <InputNumber value={formData.min_sdk} onChange={(val) => setFormData(prev => ({ ...prev, min_sdk: val || 21 }))} min={1} max={34} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>更新说明</label>
            <Input.TextArea value={formData.changelog} onChange={(e) => setFormData(prev => ({ ...prev, changelog: e.target.value }))} placeholder="描述本次更新的内容..." rows={3} />
          </div>
        </Space>
      </Modal>
    </>
  );
}
