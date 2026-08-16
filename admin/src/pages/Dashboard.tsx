import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, theme } from 'antd';
import {
  AppstoreOutlined, PlusOutlined, LogoutOutlined, UserOutlined,
  GlobalOutlined, AndroidOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AppList from '../components/AppList';
import AppForm from '../components/AppForm';
import { AppItem } from '../api/services';

const { Header, Sider, Content } = Layout;

export default function Dashboard() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'admin';
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res: any = await (await import('../api/services')).appApi.getList();
      setApps(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleEdit = (app: AppItem) => {
    setEditingApp(app);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingApp(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    fetchApps();
  };

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark">
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 600 }}>
          🐱 毛子云
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['apps']} items={[
          { key: 'apps', icon: <AppstoreOutlined />, label: '应用管理' },
        ]} />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>应用管理</h2>
          <Dropdown menu={userMenu} placement="bottomRight">
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{username}</span>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <div style={{ padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, minHeight: 500 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#8c8c8c' }}>
                  共 {apps.length} 个应用（APK: {apps.filter(a => a.type === 'APK').length} / Web: {apps.filter(a => a.type === 'WEB').length}）
                </span>
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                添加应用
              </Button>
            </div>
            <AppList
              apps={apps}
              loading={loading}
              onEdit={handleEdit}
              onRefresh={fetchApps}
            />
          </div>
        </Content>
      </Layout>

      <AppForm
        open={modalOpen}
        editingApp={editingApp}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </Layout>
  );
}
