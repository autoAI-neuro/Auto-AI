import React, { useState } from 'react';
import AutomationList from '../components/AutomationList';
import AutomationBuilder from '../components/AutomationBuilder';

const AutomationsPage = () => {
    const [view, setView] = useState('list'); // 'list' or 'create'

    return (
        <div className="h-full">
            {view === 'list' ? (
                <AutomationList onCreateNew={() => setView('create')} />
            ) : (
                <AutomationBuilder
                    onCancel={() => setView('list')}
                    onSaveSuccess={() => setView('list')}
                />
            )}
        </div>
    );
};

export default AutomationsPage;
