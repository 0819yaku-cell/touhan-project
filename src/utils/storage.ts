const PREFIX_MASTERED = 'touhan_mastered_';
const PREFIX_HISTORY = 'touhan_history_';
const LAST_Q_KEY = 'touhan_last_question';

/**
 * 質問の回答結果と最後に解いた問題IDを保存する
 * @param questionId 
 * @param isCorrect 
 */
export function saveResult(questionId: string | number, isCorrect: boolean) {
    if (typeof window === 'undefined') return;
    const idStr = String(questionId);

    // 最後に解いた問題を記録
    localStorage.setItem(LAST_Q_KEY, idStr);

    // 正誤履歴を保存（間違えた問題の復習用）
    localStorage.setItem(`${PREFIX_HISTORY}${idStr}`, isCorrect ? 'correct' : 'incorrect');

}

/**
 * ユーザーが手動でマスター状態を切り替える
 */
export function toggleMaster(questionId: string | number, isMastered: boolean) {
    if (typeof window === 'undefined') return;
    const idStr = String(questionId);
    const key = `${PREFIX_MASTERED}${idStr}`;

    if (isMastered) {
        localStorage.setItem(key, 'true');
    } else {
        localStorage.removeItem(key);
    }
}

/**
 * 全体のマスター数（正解済みの数）を返す
 */
export function getStats(): number {
    if (typeof window === 'undefined') return 0;
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX_MASTERED) && localStorage.getItem(key) === 'true') {
            count++;
        }
    }
    return count;
}

/**
 * 最後に解いた問題IDを返す
 */
export function getLastQuestionId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_Q_KEY);
}

/**
 * まだマスターしていない問題IDのリストを取得
 */
export function getUnmasteredIds(allIds: string[]): string[] {
    if (typeof window === 'undefined') return allIds;
    return allIds.filter(id => localStorage.getItem(`${PREFIX_MASTERED}${id}`) !== 'true');
}

/**
 * 間違えたまま（未マスター）の問題IDリストを取得
 */
export function getIncorrectIds(allIds: string[]): string[] {
    if (typeof window === 'undefined') return [];
    return allIds.filter(id => {
        const isMastered = localStorage.getItem(`${PREFIX_MASTERED}${id}`) === 'true';
        const lastHistory = localStorage.getItem(`${PREFIX_HISTORY}${id}`);
        return !isMastered && lastHistory === 'incorrect';
    });
}
