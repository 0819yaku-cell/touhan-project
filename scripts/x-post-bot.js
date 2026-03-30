import { TwitterApi } from 'twitter-api-v2';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import XLSX from 'xlsx';

dotenv.config();

const QUESTIONS_PATH = path.resolve('./src/data/questions.json');
const POSTED_IDS_PATH = path.resolve('./scripts/posted-ids.json');
const TRIVIA_EXCEL_PATH = path.resolve('./public/豆知識/豆知識①.xlsx');
const BASE_URL = 'https://touhan-quiz.com/questions/';

// Check for arguments
const isDryRun = process.argv.includes('--dry-run');
const isTrivia = process.argv.includes('--type=trivia');

async function postDailyQuestion() {
    try {
        // 1. Load questions
        const rawData = fs.readFileSync(QUESTIONS_PATH, 'utf-8');
        const questions = JSON.parse(rawData);

        // 2. Filter Chapter 3 only
        const targetChapters = [3];
        const targetQuestions = questions.filter(q => targetChapters.includes(q.chapter));

        if (targetQuestions.length === 0) {
            throw new Error('No questions found for Chapter 3.');
        }

        // 3. Duplicate Prevention Logic
        let postedIds = [];
        if (fs.existsSync(POSTED_IDS_PATH)) {
            const fileContent = fs.readFileSync(POSTED_IDS_PATH, 'utf-8');
            try {
                postedIds = JSON.parse(fileContent).map(id => Number(id));
            } catch (e) {
                postedIds = [];
            }
        }

        // Filter out already posted IDs
        let availableQuestions = targetQuestions.filter(q => !postedIds.includes(q.id));

        // Reset logic if all questions have been posted
        if (availableQuestions.length === 0) {
            console.log('All questions have been posted. Resetting the history.');
            postedIds = [];
            availableQuestions = targetQuestions;
        }

        // 4. Select one at random
        const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

        const mainTweetContent = `${randomQuestion.question}\n\n#登録販売者 #登録販売者試験`;
        const replyTweetContent = `【答え】\n${randomQuestion.isCorrect ? '○' : '×'}\n\n【詳細解説】\n${BASE_URL}${randomQuestion.id}`;

        if (isDryRun) {
            console.log('--- DRY RUN MODE ---');
            console.log(`Available: ${availableQuestions.length}/${targetQuestions.length}`);
            console.log(`Already Posted: ${postedIds.length}`);
            console.log('[MAIN TWEET]');
            console.log(mainTweetContent);
            console.log('\n[REPLY TWEET]');
            console.log(replyTweetContent);
            console.log('--------------------');
            return;
        }

        // 5. Initialize X API Client
        const client = new TwitterApi({
            appKey: process.env.X_API_KEY,
            appSecret: process.env.X_API_SECRET,
            accessToken: process.env.X_ACCESS_TOKEN,
            accessSecret: process.env.X_ACCESS_SECRET,
        });

        // 6. Post to X
        console.log('Posting main tweet...');
        const mainTweet = await client.v2.tweet(mainTweetContent);
        console.log(`Main tweet posted! ID: ${mainTweet.data.id}`);

        console.log('Posting reply tweet...');
        await client.v2.reply(replyTweetContent, mainTweet.data.id);
        console.log('Reply tweet posted!');

        // 7. Record the ID
        postedIds.push(randomQuestion.id);
        fs.writeFileSync(POSTED_IDS_PATH, JSON.stringify(postedIds, null, 2));
        console.log(`Question ID ${randomQuestion.id} saved to history.`);

    } catch (error) {
        console.error('Error in postDailyQuestion:', error);
        process.exit(1);
    }
}

async function postDailyTrivia() {
    try {
        if (!fs.existsSync(TRIVIA_EXCEL_PATH)) {
            throw new Error(`Trivia Excel file not found at ${TRIVIA_EXCEL_PATH}`);
        }

        // 1. Load the Excel workbook and the first sheet
        const workbook = XLSX.readFile(TRIVIA_EXCEL_PATH);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // 2. Parse into JSON array
        let rows = XLSX.utils.sheet_to_json(sheet);

        // 3. Filter available rows (not marked as "済")
        let availableRows = rows.filter(row => row['投稿済み'] !== '済');

        // Reset if all are posted
        if (availableRows.length === 0) {
            console.log('All trivia items have been posted. Resetting the history.');
            rows.forEach(row => { row['投稿済み'] = ''; });
            availableRows = [...rows]; // copy the reset rows
        }

        if (availableRows.length === 0) {
            throw new Error('No valid trivia found in the Excel file.');
        }

        // 4. Select one randomly
        const randomRow = availableRows[Math.floor(Math.random() * availableRows.length)];
        const tweetContent = randomRow['投稿内容'];

        if (isDryRun) {
            console.log('--- TRIVIA DRY RUN MODE ---');
            console.log(`Available: ${availableRows.length}/${rows.length}`);
            console.log('[TRIVIA TWEET]');
            console.log(tweetContent);
            console.log('---------------------------');
            // Mock marking as posted
            randomRow['投稿済み'] = '済';
            console.log(`Row ID ${randomRow['ID']} would be marked as '済'.`);
            return;
        }

        // 5. Initialize X API Client
        const client = new TwitterApi({
            appKey: process.env.X_API_KEY,
            appSecret: process.env.X_API_SECRET,
            accessToken: process.env.X_ACCESS_TOKEN,
            accessSecret: process.env.X_ACCESS_SECRET,
        });

        // 6. Post to X
        console.log('Posting trivia tweet...');
        const mainTweet = await client.v2.tweet(tweetContent);
        console.log(`Trivia tweet posted! ID: ${mainTweet.data.id}`);

        // 7. Update Excel state
        const targetId = randomRow['ID'];
        rows.forEach(row => {
            if (row['ID'] === targetId) {
                row['投稿済み'] = '済';
            }
        });

        const newSheet = XLSX.utils.json_to_sheet(rows);
        workbook.Sheets[sheetName] = newSheet;
        XLSX.writeFile(workbook, TRIVIA_EXCEL_PATH);
        console.log(`Trivia ID ${targetId} saved as posted in Excel.`);

    } catch (error) {
        console.error('Error in postDailyTrivia:', error);
        process.exit(1);
    }
}

// Main execution orchestrator
if (isTrivia) {
    postDailyTrivia();
} else {
    postDailyQuestion();
}
