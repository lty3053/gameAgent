import React, { useState, useEffect, useRef } from 'react';
import { Layout, Upload, Form, Input, message, Select, Row, Col } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  Link as LinkIcon, 
  ArrowLeft, 
  FileCheck, 
  HardDrive, 
  Save,
  Loader2,
  Database,
  Cloud
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadFile, getUploadProgress, uploadNetdisk } from '../api/api';
import './UploadPage.css';

const { Header, Content } = Layout;
const { Dragger } = Upload;
const { TextArea } = Input;

function UploadPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [uploadMode, setUploadMode] = useState('s3'); // 's3' or 'netdisk'
  const [file, setFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null); // 封面图片
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadId] = useState(() => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const pollTimer = useRef(null);

  // 轮询进度函数
  const startPolling = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    
    pollTimer.current = setInterval(async () => {
      const data = await getUploadProgress(uploadId);
      if (data) {
        if (data.percent > 0) {
          setUploadProgress(data.percent);
        }
        
        if (data.status === 'completed' || data.percent === 100) {
          clearInterval(pollTimer.current);
          message.success('Success!');
          setTimeout(() => navigate('/chat'), 1000);
        } else if (data.status === 'error') {
          clearInterval(pollTimer.current);
          message.error(data.error || 'Error occurred');
          setUploading(false);
        }
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const handleFileSelect = (file) => {
    setFile(file);
    form.setFieldsValue({ name: file.name.replace(/\.[^/.]+$/, '') });
    return false;
  };

  const handleCoverSelect = (file) => {
    setCoverImage(file);
    return false;
  };

  const handleSubmit = async (values) => {
    if (uploadMode === 's3' && !file) {
      message.error('Please select a file first');
      return;
    }

    if (uploadMode === 'netdisk' && !values.netdisk_url) {
      message.error('Link is required');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      if (uploadMode === 's3') {
        startPolling();
        await uploadFile(
          file,
          (percent) => setUploadProgress(Math.min(percent, 5)),
          { ...values, coverImage },
          uploadId
        );
      } else {
        startPolling();
        await uploadNetdisk(
          {
            name: values.name,
            description: values.description,
            netdisk_url: values.netdisk_url,
            netdisk_type: values.netdisk_type || 'quark',
            file_size: values.file_size,
            coverImage
          },
          uploadId
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error(error.message || 'Upload failed');
      setUploading(false);
      if (pollTimer.current) clearInterval(pollTimer.current);
    }
  };

  return (
    <Layout className="upload-page">
      <Header className="upload-header">
        <div className="header-content">
          <button onClick={() => navigate('/chat')} className="back-btn">
            <ArrowLeft size={20} />
            <span>BACK</span>
          </button>
          <h1 className="header-title">UPLOAD GAME</h1>
          <div style={{ width: 80 }}></div>
        </div>
      </Header>

      <Content className="upload-content">
        <motion.div 
          className="upload-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Left Panel: Mode Specific */}
          <motion.div className="upload-left-panel">
            {/* Custom Mode Switcher */}
            <div className="mode-switch-container">
              <div 
                className={`mode-switch-btn ${uploadMode === 's3' ? 'active' : ''}`}
                onClick={() => setUploadMode('s3')}
              >
                <HardDrive size={18} />
                <span>S3 DIRECT</span>
              </div>
              <div 
                className={`mode-switch-btn ${uploadMode === 'netdisk' ? 'active' : ''}`}
                onClick={() => setUploadMode('netdisk')}
              >
                <LinkIcon size={18} />
                <span>NETDISK LINK</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {uploadMode === 's3' ? (
                <motion.div 
                  key="s3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  <Dragger
                    name="file"
                    multiple={false}
                    beforeUpload={handleFileSelect}
                    showUploadList={false}
                    disabled={uploading}
                    className="custom-dragger"
                  >
                    <div className="upload-placeholder">
                      <UploadCloud className="upload-icon-large" />
                      <div className="upload-text-main">DRAG & DROP</div>
                      <div className="upload-text-sub">or click to browse</div>
                    </div>
                  </Dragger>
                  
                  {file && (
                    <div className="file-pill">
                      <FileCheck className="file-pill-icon" size={24} />
                      <div className="file-details">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="netdisk"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ height: '100%' }}
                >
                  <div className="netdisk-display">
                    <div className="netdisk-glow-icon">
                      <Cloud className="netdisk-icon-inner" size={48} color="#ff4d4f" />
                    </div>
                    <h3 style={{ fontSize: '24px', marginBottom: '16px', color: 'white' }}>Cloud Resource</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '300px' }}>
                      Save shared links directly without re-uploading. Supports Quark, Baidu, and Aliyun Drive.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Panel: Form */}
          <div className="upload-right-panel">
            <span className="section-label">Game Metadata</span>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              disabled={uploading}
            >
              {uploadMode === 'netdisk' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="netdisk_type" initialValue="quark">
                        <Select 
                          className="minimal-select"
                          dropdownStyle={{ background: '#1a1a1a', border: '1px solid #333' }}
                        >
                          <Select.Option value="quark">Quark Drive</Select.Option>
                          <Select.Option value="baidu">Baidu Netdisk</Select.Option>
                          <Select.Option value="aliyun">Aliyun Drive</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                       <Form.Item name="file_size">
                        <Input className="minimal-input" placeholder="Total Size (e.g. 15GB)" autoComplete="off" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="netdisk_url"
                    rules={[{ required: true, message: 'Link is required' }]}
                  >
                    <Input className="minimal-input" placeholder="Share Link (Permanent, No Code)" autoComplete="off" />
                  </Form.Item>
                </motion.div>
              )}

              <Form.Item
                name="name"
                rules={[{ required: true, message: 'Game Name is required' }]}
              >
                <Input className="minimal-input" placeholder="Game Name" autoComplete="off" />
              </Form.Item>

              <Form.Item name="cover" style={{ marginTop: '24px' }}>
                <Upload
                  accept="image/*"
                  beforeUpload={handleCoverSelect}
                  maxCount={1}
                  listType="picture-card"
                  className="cover-uploader"
                >
                  {!coverImage && (
                    <div style={{ color: 'rgba(255,255,255,0.6)' }}>
                      <UploadCloud size={32} style={{ marginBottom: '8px' }} />
                      <div>Cover Image (Optional)</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item name="description" style={{ marginTop: '32px' }}>
                <TextArea
                  rows={6}
                  className="minimal-textarea"
                  placeholder="Description..."
                  autoComplete="off"
                />
              </Form.Item>

              <div style={{ marginTop: '48px' }}>
                <button 
                  type="submit" 
                  className="neon-btn"
                  disabled={(uploadMode === 's3' && !file) || uploading}
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} />
                  )}
                  <span>{uploading ? 'PROCESSING...' : 'SAVE GAME'}</span>
                </button>
              </div>
            </Form>
          </div>
        </motion.div>
      </Content>

      {uploading && (
        <div className="glass-overlay">
          <motion.div 
            className="glass-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="percentage-giant">
              {uploadProgress}%
            </div>
            <div className="progress-status">
              {uploadProgress === 100 ? 'FINALIZING...' : 'UPLOADING...'}
            </div>
            <div style={{ marginTop: '16px', color: 'rgba(255,255,255,0.3)' }}>
               {file?.name || 'Processing Request'}
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}

export default UploadPage;
