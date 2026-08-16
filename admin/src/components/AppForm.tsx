import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Upload, message, Radio, App as AntdApp } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { AppItem, appApi, fileApi } from '../api/services';

interface Props {
  open: boolean;
  editingApp: AppItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppForm({ open, editingApp, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const { message: msg } = AntdApp.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [iconUrl, setIconUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [appType, setAppType] = useState<'APK' | 'WEB'>('APK');

  useEffect(() => {
    if (open) {
      if (editingApp) {
        setAppType(editingApp.type as 'APK' | 'WEB');
        setIconUrl(editingApp.icon_url || '');
        form.setFieldsValue({
          name: editingApp.name,
          description: editingApp.description,
          type: editingApp.type,
          category: editingApp.category,
          status: editingApp.status,
          web_url: editingApp.web_url || '',
          display_mode: editingApp.display_mode || 'webview',
        });
        setFileList(editingApp.icon_url ? [{ uid: '-1', name: 'icon', status: 'done', url: editingApp.icon_url }] : []);
      } else {
        form.resetFields();
        form.setFieldsValue({ type: 'APK', status: 'online', category: '未排序', display_mode: 'webview' });
        setAppType('APK');
        setIconUrl('');
        setFileList([]);
      }
    }
  }, [open, editingApp, form]);

  const handleIconUpload = async (file: File) => {
    setUploading(true);
    try {
      const res: any = await fileApi.uploadImage(file);
      setIconUrl(res.data.file_url);
      msg.success('图标上传成功');
    } catch {
      // 错误已在拦截器处理
    } finally {
      setUploading(false);
    }
    return false; // 阻止默认上传
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data = {
        name: values.name,
        description: values.description || '',
        icon_url: iconUrl,
        type: values.type,
        category: values.category || '未排序',
        status: values.status,
        web_url: values.web_url,
        display_mode: values.display_mode || 'webview',
      };

      if (editingApp) {
        await appApi.update(editingApp.id, data);
        msg.success('更新成功');
      } else {
        await appApi.create(data);
        msg.success('创建成功');
      }
      onSuccess();
    } catch (err: any) {
      if (err.errorFields) {
        // 表单验证错误
        return;
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editingApp ? '编辑应用' : '添加应用'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
        <Form.Item label="应用图标">
          <Upload.Dragger
            fileList={fileList}
            beforeUpload={handleIconUpload}
            onChange={({ fileList: newList }) => setFileList(newList)}
            showUploadList={{ showRemoveIcon: true }}
            maxCount={1}
            accept="image/*"
            listType="picture"
          >
            {fileList.length === 0 && (
              <div style={{ padding: 20 }}>
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p>点击或拖拽上传图标</p>
              </div>
            )}
          </Upload.Dragger>
        </Form.Item>

        <Form.Item name="name" label="应用名称" rules={[{ required: true, message: '请输入应用名称' }]}>
          <Input placeholder="请输入应用名称" maxLength={50} />
        </Form.Item>

        <Form.Item name="description" label="应用简介">
          <Input.TextArea placeholder="请输入应用简介" rows={3} maxLength={200} showCount />
        </Form.Item>

        <Form.Item name="type" label="应用类型" rules={[{ required: true }]}>
          <Radio.Group onChange={(e) => setAppType(e.target.value)}>
            <Radio.Button value="APK">Android APK</Radio.Button>
            <Radio.Button value="WEB">Web 应用</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="category" label="分类">
          <Input placeholder="如：工具、游戏、社交" maxLength={20} />
        </Form.Item>

        <Form.Item name="status" label="状态" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio.Button value="online">上架</Radio.Button>
            <Radio.Button value="offline">下架</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {appType === 'WEB' && (
          <>
            <Form.Item name="web_url" label="Web 地址" rules={[{ required: true, message: '请输入 Web 地址' }, { type: 'url', message: '请输入有效的 URL' }]}>
              <Input placeholder="https://example.com" />
            </Form.Item>
            <Form.Item name="display_mode" label="打开方式">
              <Radio.Group>
                <Radio.Button value="webview">内置 WebView</Radio.Button>
                <Radio.Button value="browser">外部浏览器</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
