import React from 'react';
import AlbumCard from '../AlbumCard/AlbumCard';
import './AlbumGrid.css';

const AlbumGrid = ({ songs = [], onPlaySong, onAddToQueue }) => {
    return (
        <div className="album-grid">
            {songs.map((song) => (
                <AlbumCard
                    key={song.id}
                    song={song}
                    onClick={() => onPlaySong(song)}
                    onAddToQueue={onAddToQueue}
                />
            ))}
        </div>
    );
};

export default AlbumGrid;
