import { GameType } from "../render/page_controller.js";
import { Piece, PieceAtCoord, pieceAtCoordEquals } from "./piece.js";

export interface HintStats {
    hints: PieceAtCoord[],
}

export function serializeHintStats(hintStats: HintStats): string {
    return JSON.stringify(hintStats.hints.map((hint: PieceAtCoord) => {
        return {
            piece: hint.piece.toString(),
            coord: hint.coord,
        };
    }));
}

export function deserializeHintStats(str: string): HintStats {
    const hints = JSON.parse(str);
    for (const hint of hints) {
        hint.piece = Piece.fromString(hint.piece);
    }
    return {
        hints: hints as PieceAtCoord[],
    };
}

export function isInHints(piece: PieceAtCoord, hints: HintStats): boolean {
    for (const hint of hints.hints) {
        if (pieceAtCoordEquals(piece, hint)) {
            return true;
        }
    }
    return false;
}

export interface SolutionStats {
    hash: string,
    gameType: GameType,
    solutionText: string,
    elapsedMs: number,
    hints: string,
}

export function getSolutionStats(hash: string): SolutionStats | null {
    const str = localStorage.getItem(`solutionStats:${hash}`);
    if (!str) {
        return null;
    }
    const obj = JSON.parse(str);
    if (
        !obj.hasOwnProperty('hash') ||
        !obj.hasOwnProperty('gameType') ||
        !obj.hasOwnProperty('solutionText') ||
        !obj.hasOwnProperty('elapsedMs') ||
        !obj.hasOwnProperty('hints')
    ) {
        console.warn(
            `Found SolutionStats for hash '${hash}', `
            + `but it failed validation`);
        return null;
    }
    return obj as SolutionStats;
}

export function setSolutionStats(stats: SolutionStats): void {
    localStorage.setItem(`solutionStats:${stats.hash}`, JSON.stringify(stats));
}
