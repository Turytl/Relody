import React from 'react';
import './AlbumCard.css';

const DownloadIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z" />
    </svg>
);

const AddQueueIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 11H13V5h-2v6H5v2h6v6h2v-6h6v-2z" />
    </svg>
);

const AlbumCard = ({ song, onClick, onAddToQueue }) => {
    const downloadUrl = `http://127.0.0.1:5000/api/download/${song.id}?title=${encodeURIComponent(song.title)}`;

    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(song));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            className="album-card"
            onClick={onClick}
            draggable
            onDragStart={handleDragStart}
        >
            <div className="album-cover-container">
                <img src={song.cover} alt={song.title} className="album-cover" />
                <div className="album-overlay">
                    <div className="play-icon">▶</div>
                    <div className="album-overlay-actions">
                        {onAddToQueue && (
                            <button
                                className="overlay-btn"
                                onClick={(e) => { e.stopPropagation(); onAddToQueue(song); }}
                                title="Add to queue"
                            >
                                <AddQueueIcon />
                            </button>
                        )}
                        <a
                            className="overlay-btn"
                            href={downloadUrl}
                            download
                            onClick={(e) => e.stopPropagation()}
                            title="Download MP3"
                        >
                            <DownloadIcon />
                        </a>
                    </div>
                </div>
            </div>
            <div className="album-info">
                <h3 className="album-title">{song.title}</h3>
            </div>
        </div>
    );
};

export default AlbumCard;
