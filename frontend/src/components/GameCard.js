import React from 'react';
import { Download, Link as LinkIcon, Gamepad2, Cloud, HardDrive } from 'lucide-react';
import './GameCard.css';

function GameCard({ game }) {
  const downloadUrl = game.game_file_url;
  const coverImage = game.cover_image_url;
  const isNetdisk = game.storage_type === 'netdisk';
  
  const netdiskNames = {
    'quark': 'Quark Drive',
    'baidu': 'Baidu Netdisk',
    'aliyun': 'Aliyun Drive'
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = game.name || 'game';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
          <h3 className="card-title">{game.name}</h3>
          {isNetdisk ? (
            <div className="card-type-tag tag-netdisk">
              <Cloud size={10} />
              <span>{netdiskNames[game.netdisk_type] || 'CLOUD'}</span>
            </div>
          ) : (
             <div className="card-type-tag tag-s3">
              <HardDrive size={10} />
              <span>S3</span>
            </div>
          )}
        </div>

        <div className="card-desc">
          {game.description || 'No description available.'}
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
            disabled={!downloadUrl}
          >
            {isNetdisk ? <LinkIcon size={16} /> : <Download size={16} />}
            <span>{isNetdisk ? 'GET LINK' : 'DOWNLOAD'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameCard;
