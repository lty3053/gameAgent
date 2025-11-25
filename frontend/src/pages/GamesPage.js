import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Tag, Button, Input, message } from 'antd';
import { SearchOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getGames, searchGames } from '../api/api';
import CyberLoader from '../components/CyberLoader';
import './GamesPage.css';

const { Header, Content } = Layout;
const { Meta } = Card;

function GamesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const startTime = Date.now();
    const MIN_LOADING_TIME = 1000;
    
    try {
      setLoading(true);
      const response = await getGames();
      setGames(response.games || []);
    } catch (error) {
      message.error(t('games.loadFailed'));
      console.error('Error loading games:', error);
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = MIN_LOADING_TIME - elapsed;
      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
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
      message.error(t('games.searchFailed'));
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
            {t('games.back')}
          </Button>
          <h1>🎮 {t('games.title')}</h1>
          <div className="search-box">
            <Input
              placeholder={t('games.search')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Button type="primary" onClick={handleSearch}>
              {t('games.searchBtn')}
            </Button>
          </div>
        </div>
      </Header>

      <Content className="games-content">
        <div className="games-container">
          {loading ? (
            <CyberLoader text="LOADING GAMES" />
          ) : games.length === 0 ? (
            <div className="empty-state">
              <h2>{t('games.empty.title')}</h2>
              <p>{t('games.empty.subtitle')}</p>
              <Button type="primary" onClick={() => navigate('/upload')}>
                {t('games.empty.uploadBtn')}
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
                            {t('gameDetail.back')}
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
                            : t('gameCard.noDescription')}
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
