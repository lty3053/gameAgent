import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Tag, Button, Input, message, Spin } from 'antd';
import { SearchOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getGames, searchGames } from '../api/api';
import './GamesPage.css';

const { Header, Content } = Layout;
const { Meta } = Card;

function GamesPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await getGames();
      setGames(response.games || []);
    } catch (error) {
      message.error('加载游戏列表失败');
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      loadGames();
      return;
    }

    try {
      setLoading(true);
      const response = await searchGames(searchValue);
      setGames(response.games || []);
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const mb = parseInt(bytes) / 1024 / 1024;
    return mb.toFixed(0) + 'MB';
  };

  const handleGameClick = (gameId) => {
    navigate(`/games/${gameId}`);
  };

  return (
    <Layout className="games-page">
      <Header className="games-header">
        <div className="header-content">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/chat')}
            className="back-btn"
          >
            返回
          </Button>
          <h1>🎮 游戏库</h1>
          <div className="search-box">
            <Input
              placeholder="搜索游戏..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
          </div>
        </div>
      </Header>

      <Content className="games-content">
        <div className="games-container">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" tip="加载中..." />
            </div>
          ) : games.length === 0 ? (
            <div className="empty-state">
              <h2>暂无游戏</h2>
              <p>还没有上传任何游戏，快去上传吧！</p>
              <Button type="primary" onClick={() => navigate('/upload')}>
                上传游戏
              </Button>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {games.map((game) => (
                <Col xs={24} sm={12} md={8} lg={6} key={game.id}>
                  <Card
                    hoverable
                    className="game-card"
                    cover={
                      <div className="game-cover">
                        {game.cover_image_url ? (
                          <img alt={game.name} src={game.cover_image_url} />
                        ) : (
                          <div className="default-cover">
                            <span className="game-icon">🎮</span>
                          </div>
                        )}
                        <div className="cover-overlay">
                          <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => handleGameClick(game.id)}
                          >
                            查看详情
                          </Button>
                        </div>
                        <div className="game-badges">
                          {game.file_size && (
                            <Tag className="size-badge">
                              {formatFileSize(game.file_size)}
                            </Tag>
                          )}
                          {game.release_date && (
                            <Tag className="year-badge">{game.release_date}</Tag>
                          )}
                        </div>
                      </div>
                    }
                    onClick={() => handleGameClick(game.id)}
                  >
                    <Meta
                      title={
                        <div className="game-title">
                          <span className="title-text">{game.name}</span>
                          {game.name_en && (
                            <span className="title-en">{game.name_en}</span>
                          )}
                        </div>
                      }
                      description={
                        <div className="game-description">
                          {game.description
                            ? game.description.substring(0, 60) + '...'
                            : '暂无描述'}
                        </div>
                      }
                    />
                    {game.category && (
                      <div className="game-tags">
                        <Tag color="blue">{game.category}</Tag>
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default GamesPage;
