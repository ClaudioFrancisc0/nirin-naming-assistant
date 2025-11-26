import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import NameList from './components/NameList';
import NCLSelector from './components/NCLSelector';
import { checkAvailability } from './api';

import INPIResultsModal from './components/INPIResultsModal';
import InstagramResultsModal from './components/InstagramResultsModal';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-white text-red-600 h-screen overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Algo deu errado.</h1>
          <pre className="bg-gray-100 p-4 rounded text-sm font-mono">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [selectedNames, setSelectedNames] = useState([]);
  const [isNCLModalOpen, setIsNCLModalOpen] = useState(false);
  const [globalNCL, setGlobalNCL] = useState(null); // Store NCL globally
  const [nameToCheck, setNameToCheck] = useState(null);
  const [checkingName, setCheckingName] = useState(null); // Changed from boolean to string (name)

  // Modals State
  const [inpiModalData, setInpiModalData] = useState(null);
  const [instagramModalData, setInstagramModalData] = useState(null);

  const handleAddName = (name) => {
    // Clean name (remove punctuation if needed)
    const cleanName = name.replace(/[*_]/g, '').trim();

    if (!selectedNames.find(n => n.name === cleanName)) {
      setSelectedNames([...selectedNames, { name: cleanName, checked: false }]);
    }
  };

  const handleRemoveName = (name) => {
    setSelectedNames(selectedNames.filter(n => n.name !== name));
  };

  const handleInitiateCheck = (name) => {
    setNameToCheck(name);

    // If we already have a Global NCL, skip the modal and check directly
    if (globalNCL) {
      performCheck(name, globalNCL);
    } else {
      setIsNCLModalOpen(true);
    }
  };

  const handleNCLSelect = (nclId) => {
    setGlobalNCL(nclId); // Save for future checks
    setIsNCLModalOpen(false);

    if (nameToCheck) {
      performCheck(nameToCheck, nclId);
    }
  };

  const handleShowINPIDetails = (nameData) => {
    setInpiModalData({
      name: nameData.name,
      ncl: nameData.ncl,
      results: nameData.inpi?.foundProcesses || []
    });
  };

  const handleShowInstagramDetails = (nameData) => {
    if (nameData.instagram?.foundProfile) {
      setInstagramModalData(nameData.instagram.foundProfile);
    }
  };

  const performCheck = async (name, ncl) => {
    setCheckingName(name);

    try {
      const result = await checkAvailability(name, ncl);

      setSelectedNames(prev => prev.map(item => {
        if (item.name === name) {
          return {
            ...item,
            checked: true,
            ncl: ncl,
            instagram: result.instagram,
            inpi: result.inpi
          };
        }
        return item;
      }));
    } catch (error) {
      console.error("Check failed", error);
    } finally {
      setCheckingName(null);
      setNameToCheck(null);
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-nirin-bg text-nirin-text overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="w-full bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="text-2xl font-bold tracking-tight" style={{ color: '#0046FF' }}>
            NIRIN
          </div>
          <div className="text-lg font-medium tracking-wide" style={{ color: '#0046FF' }}>
            Assistente de Naming
          </div>
        </div>

        {/* Main Content - Takes remaining height with independent scrolling */}
        <div className="flex-1 flex relative overflow-hidden">
          <ChatInterface onAddName={handleAddName} />
          <NameList
            names={selectedNames}
            onAdd={handleAddName}
            onRemove={handleRemoveName}
            onCheck={handleInitiateCheck}
            onShowINPIDetails={handleShowINPIDetails}
            onShowInstagramDetails={handleShowInstagramDetails}
            checkingName={checkingName}
          />
        </div>

        {/* Modals */}
        <NCLSelector
          isOpen={isNCLModalOpen}
          onClose={() => setIsNCLModalOpen(false)}
          onSelect={handleNCLSelect}
        />

        <INPIResultsModal
          isOpen={!!inpiModalData}
          onClose={() => setInpiModalData(null)}
          name={inpiModalData?.name}
          ncl={inpiModalData?.ncl}
          results={inpiModalData?.results}
        />

        <InstagramResultsModal
          isOpen={!!instagramModalData}
          onClose={() => setInstagramModalData(null)}
          profile={instagramModalData}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
