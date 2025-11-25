from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from config import Config
import uuid

Base = declarative_base()

class Game(Base):
    __tablename__ = 'games'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    name_en = Column(String(255))
    description = Column(Text)
    category = Column(String(100))
    tags = Column(Text)  # JSON in DB, but we'll handle as Text
    game_file_url = Column(String(500))
    storage_type = Column(String(20), default='s3')  # 's3' or 'netdisk'
    netdisk_type = Column(String(50))  # 'quark', 'baidu', etc. (仅当 storage_type='netdisk' 时有效)
    cover_image_url = Column(String(500))
    video_url = Column(String(500))
    screenshots = Column(Text)  # JSON in DB
    file_size = Column(String(50))
    version = Column(String(50))
    release_date = Column(String(50))
    developer = Column(String(255))
    rating = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_en': self.name_en,
            'description': self.description,
            'category': self.category,
            'tags': self.tags,
            'game_file_url': self.game_file_url,
            'storage_type': self.storage_type,
            'netdisk_type': self.netdisk_type,
            'cover_image_url': self.cover_image_url,
            'video_url': self.video_url,
            'screenshots': self.screenshots,
            'file_size': self.file_size,
            'version': self.version,
            'release_date': self.release_date,
            'developer': self.developer,
            'rating': self.rating,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    user_key = Column(String(100), unique=True, nullable=False, index=True)  # 唯一标识符
    email = Column(String(255), unique=True, nullable=True, index=True)  # 注册用户才有
    password_hash = Column(String(255), nullable=True)  # 注册用户才有
    is_guest = Column(Boolean, default=True)  # 是否为游客
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    chat_histories = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_key': self.user_key,
            'email': self.email,
            'is_guest': self.is_guest,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_active': self.last_active.isoformat() if self.last_active else None
        }

class ChatHistory(Base):
    __tablename__ = 'chat_histories'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关系
    user = relationship("User", back_populates="chat_histories")
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

engine = create_engine(Config.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    print('Database initialized!')
