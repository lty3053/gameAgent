import React, { useState, useEffect } from 'react';
import { Download, Link as LinkIcon, Gamepad2, Cloud, HardDrive, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSignedUrl } from '../api/api';
import './GameCard.css';

function GameCard({ game }) {
  const { t, i18n } = useTranslation();
  
  // 根据语言显示名称：中文显示中文名，其他语言优先显示英文名
  const isZh = i18n.language?.startsWith('zh');
  const displayName = isZh ? game.name : (game.name_en || game.name);
  const downloadUrl = game.game_file_url;
  const isNetdisk = game.storage_type === 'netdisk';
  const [coverImage, setCoverImage] = useState(null);
  const [downloading, setDownloading] = useState(false);
  
  // 检查是否是 OSS URL
  const isOssUrl = (url) => url && url.includes('oss-cn-hangzhou.aliyuncs.com');
  
  // 获取封面图片的签名 URL
  useEffect(() => {
    const loadCoverImage = async () => {
      if (game.cover_image_url) {
        if (isOssUrl(game.cover_image_url)) {
          const signedUrl = await getSignedUrl(game.cover_image_url);
          if (signedUrl) {
            setCoverImage(signedUrl);
          }
        } else {
          setCoverImage(game.cover_image_url);
        }
      }
    };
    loadCoverImage();
  }, [game.cover_image_url]);

  const handleDownload = async () => {
    if (!downloadUrl) return;
    
    setDownloading(true);
    try {
      let finalUrl = downloadUrl;
      
      // 如果是 OSS URL，先获取签名 URL
      if (isOssUrl(downloadUrl)) {
        const signedUrl = await getSignedUrl(downloadUrl);
        if (signedUrl) {
          finalUrl = signedUrl;
        }
      }
      
      // 打开下载链接
      window.open(finalUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="game-card-modern">
      <div className="card-cover-wrapper">
        {coverImage ? (
          <img alt={game.name} src={coverImage} className="card-cover-image" />
        ) : (
          <div className="card-cover-placeholder">
            <Gamepad2 size={48} color="rgba(255,255,255,0.2)" />
          </div>
        )}
      </div>

      <div className="card-content">
        <div className="card-title-row">
          <h3 className="card-title">{displayName}</h3>
          {isNetdisk ? (
            <div className="card-type-tag tag-netdisk">
              <Cloud size={10} />
              <span>{t(`gameCard.netdiskTypes.${game.netdisk_type}`) || 'CLOUD'}</span>
            </div>
          ) : (
             <div className="card-type-tag tag-s3">
              <HardDrive size={10} />
              <span>OSS</span>
            </div>
          )}
        </div>

        <div className="card-desc">
          {game.description || t('gameCard.noDescription')}
        </div>

        <div className="card-meta">
          {game.file_size && (
            <span className="meta-tag">{game.file_size}</span>
          )}
          {game.tags && game.tags.map((tag, index) => (
            <span key={index} className="meta-tag">#{tag}</span>
          ))}
        </div>

        <div className="card-actions">
          <button 
            className={`action-btn ${isNetdisk ? 'btn-link' : 'btn-download'}`}
            onClick={handleDownload}
            disabled={!downloadUrl || downloading}
          >
            {downloading ? (
              <Loader2 size={16} className="spin" />
            ) : isNetdisk ? (
              <LinkIcon size={16} />
            ) : (
              <Download size={16} />
            )}
            <span>{isNetdisk ? t('gameCard.getLink') : t('gameCard.download')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameCard;
