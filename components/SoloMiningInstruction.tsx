import React from 'react';

import { Pickaxe, Terminal, Copy } from 'lucide-react';

const SoloMiningInstruction: React.FC = () => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6 mb-8 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Pickaxe size={18} />
          </span>
          Solo Mining Instructions
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
            <Terminal size={14} />
            Stratum Connection
          </h3>
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm space-y-2 relative group">
            <div className="flex justify-between items-center group/item">
              <span className="text-muted-foreground">URL:</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-bold">
                  stratum+tcp://ckpool.bitfinitechain.org:3333
                </span>
                <button
                  onClick={() =>
                    handleCopy('stratum+tcp://ckpool.bitfinitechain.org:3333')
                  }
                  className="p-1 hover:bg-background rounded-md text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover/item:opacity-100"
                  title="Copy URL"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">User:</span>
              <span className="text-foreground font-bold">
                Your_BitFinite_Address
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pass:</span>
              <span className="text-foreground font-bold">x</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
            <Terminal size={14} />
            Example Miner Command
          </h3>
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-xs text-foreground break-all leading-relaxed relative group">
            cpuminer -a sha256d -o stratum+tcp://ckpool.bitfinitechain.org:3333 -u
            bfx:youraddress -p x
            <button
              onClick={() =>
                handleCopy(
                  'cpuminer -a sha256d -o stratum+tcp://ckpool.bitfinitechain.org:3333 -u bfx:youraddress -p x'
                )
              }
              className="absolute top-2 right-2 p-1 hover:bg-background rounded-md text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              title="Copy Command"
            >
              <Copy size={12} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Replace{' '}
            <span className="font-mono text-primary">bfx:youraddress</span> with
            your actual BitFinite wallet address.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SoloMiningInstruction;
