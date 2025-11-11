import React from 'react';
import '../HomePage.css'

interface PublisherCardProps {
    id: string;
    name: string;
    description: string;
    numOfDatasets: number;
}

export const PublisherCard: React.FC<PublisherCardProps> = ({ id, name, description, numOfDatasets }) => {
    return (
        <div className="publisher-card" data-id={id}>
            <p className="publisher-para">{name} [{numOfDatasets}]</p>
        </div>
    );
};