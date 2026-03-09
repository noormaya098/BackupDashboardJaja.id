import React, { useState } from 'react';
import { Button, Tooltip } from '@material-tailwind/react';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import cacheManager from '../../utils/cacheManager';

const CacheControl = () => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await cacheManager.clearCache();
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleForceRefresh = () => {
    cacheManager.forceRefresh();
  };

  return (
    <div className="flex gap-2">
      <Tooltip content="Clear Cache">
        <Button
          variant="outlined"
          size="sm"
          color="blue"
          className="flex items-center gap-1"
          onClick={handleClearCache}
          disabled={isClearing}
        >
          <TrashIcon className="h-4 w-4" />
          {isClearing ? 'Clearing...' : 'Clear Cache'}
        </Button>
      </Tooltip>
      
      <Tooltip content="Force Refresh">
        <Button
          variant="outlined"
          size="sm"
          color="green"
          className="flex items-center gap-1"
          onClick={handleForceRefresh}
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </Button>
      </Tooltip>
    </div>
  );
};

export default CacheControl;

