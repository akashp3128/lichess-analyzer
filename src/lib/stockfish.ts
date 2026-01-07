import { StockfishEvaluation } from '@/types';

export class StockfishEngine {
  private worker: Worker | null = null;
  private isReady = false;
  private pendingResolve: ((value: StockfishEvaluation) => void) | null = null;
  private currentEval: Partial<StockfishEvaluation> = {};
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.isReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      try {
        console.log('Initializing Stockfish...');

        // Use local stockfish.js file
        this.worker = new Worker('/stockfish.js');

        this.worker.onmessage = (e: MessageEvent) => {
          const message = e.data;
          console.log('Stockfish:', message);

          if (typeof message === 'string') {
            this.handleMessage(message);

            if (message === 'readyok' && !this.isReady) {
              this.isReady = true;
              console.log('Stockfish ready!');
              resolve();
            }
          }
        };

        this.worker.onerror = (e) => {
          console.error('Stockfish worker error:', e);
          reject(new Error(`Stockfish worker error: ${e.message}`));
        };

        // Send UCI commands to initialize
        setTimeout(() => {
          this.worker?.postMessage('uci');
        }, 100);

        // Timeout after 30 seconds
        setTimeout(() => {
          if (!this.isReady) {
            reject(new Error('Stockfish initialization timeout - engine did not respond'));
          }
        }, 30000);
      } catch (error) {
        console.error('Failed to create Stockfish worker:', error);
        reject(error);
      }
    });

    return this.initPromise;
  }

  private handleMessage(message: string): void {
    if (message === 'uciok') {
      console.log('UCI OK received, sending isready...');
      this.worker?.postMessage('setoption name Skill Level value 20');
      this.worker?.postMessage('isready');
    }

    if (message.startsWith('info depth')) {
      this.parseInfoLine(message);
    }

    if (message.startsWith('bestmove')) {
      const parts = message.split(' ');
      const bestMove = parts[1];

      if (this.pendingResolve && bestMove && bestMove !== '(none)') {
        this.pendingResolve({
          depth: this.currentEval.depth || 0,
          evaluation: this.currentEval.evaluation || 0,
          bestMove,
          isMate: this.currentEval.isMate || false,
          mateIn: this.currentEval.mateIn || null,
        });
        this.pendingResolve = null;
        this.currentEval = {};
      }
    }
  }

  private parseInfoLine(line: string): void {
    const parts = line.split(' ');
    const depthIndex = parts.indexOf('depth');
    const scoreIndex = parts.indexOf('score');

    if (depthIndex !== -1) {
      this.currentEval.depth = parseInt(parts[depthIndex + 1], 10);
    }

    if (scoreIndex !== -1) {
      const scoreType = parts[scoreIndex + 1];
      const scoreValue = parseInt(parts[scoreIndex + 2], 10);

      if (scoreType === 'cp') {
        this.currentEval.evaluation = scoreValue / 100;
        this.currentEval.isMate = false;
        this.currentEval.mateIn = null;
      } else if (scoreType === 'mate') {
        this.currentEval.isMate = true;
        this.currentEval.mateIn = scoreValue;
        // Cap mate evaluation at +/-15 pawns to prevent evalLoss corruption
        // Shorter mates are "better" so use inverse: mate in 1 = 15, mate in 10 = 6
        const mateValue = Math.max(6, 15 - Math.abs(scoreValue) + 1);
        this.currentEval.evaluation = scoreValue > 0 ? mateValue : -mateValue;
      }
    }
  }

  async evaluate(fen: string, depth = 15): Promise<StockfishEvaluation> {
    // Ensure engine is initialized
    await this.init();

    if (!this.worker || !this.isReady) {
      throw new Error('Stockfish not initialized');
    }

    return new Promise((resolve, reject) => {
      this.pendingResolve = resolve;
      this.currentEval = {};

      this.worker?.postMessage('ucinewgame');
      this.worker?.postMessage(`position fen ${fen}`);
      this.worker?.postMessage(`go depth ${depth}`);

      // Timeout for individual evaluation
      setTimeout(() => {
        if (this.pendingResolve === resolve) {
          this.pendingResolve = null;
          reject(new Error('Evaluation timeout'));
        }
      }, 30000);
    });
  }

  stop(): void {
    if (this.worker) {
      this.worker.postMessage('stop');
    }
  }

  quit(): void {
    if (this.worker) {
      this.worker.postMessage('quit');
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.initPromise = null;
    }
  }
}

let engineInstance: StockfishEngine | null = null;

export function getStockfishEngine(): StockfishEngine {
  if (!engineInstance) {
    engineInstance = new StockfishEngine();
  }
  return engineInstance;
}
