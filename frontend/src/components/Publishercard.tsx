import React from 'react';
import '../style/HomePage.css'

interface PublisherCardProps {
    id: string;
    name: string;
    numOfDatasets: number;
}

export const PublisherCard: React.FC<PublisherCardProps> = ({ id, name, numOfDatasets }) => {
    return (
        <div className="publisher-card" data-id={id}>
            <p className="publisher-para">{name} [{numOfDatasets}]</p>
        </div>
    );
};