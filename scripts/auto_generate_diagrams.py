import os
import csv
import base64
import requests
from io import BytesIO

try:
    from PIL import Image
except ImportError:
    print("エラー: Pillowがインストールされていません。 'pip install pillow' を実行してください。")
    exit(1)

# =========== 設定 ===========
# パス設定（環境に合わせて変更可能）
CSV_PATH_1 = "/home/hiroki/デスクトップ/登録販売者問題解説.csv"
CSV_PATH_2 = "/home/hiroki/Desktop/登録販売者問題解説.csv"
CSV_PATH = CSV_PATH_1 if os.path.exists(CSV_PATH_1) else CSV_PATH_2

PROJECT_ROOT = "/home/hiroki/touhan-project" if os.path.exists("/home/hiroki/touhan-project") else "/home/hiroki/Desktop/touhan-project"
DIAGRAMS_DIR = os.path.join(PROJECT_ROOT, "public/assets/images/diagrams/")
CHECK_DIR = os.path.join(PROJECT_ROOT, "public/assets/images/確認用/")

# APIキー設定 (ここにご自身のGemini APIキーを文字列として記入してください)
API_KEY = "AIzaSyCUrnmjYV6b5KKdW2Coa9P5vY5-NRV1gpc"
# ============================

def generate_english_prompt(api_key, explanation):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    instruction = f"""
    Please generate ONE single image generation prompt in English based on the following explanation for a Japanese pharmacy exam.
    
    [Conditions for the image]
    - 2-head proportion character (male, female, or animal) explaining the concept.
    - Hand-drawn picture book style (cozy, warm watercolor or colored pencil style).
    - Varied dynamic layout and composition.
    - Clean, minimal text.
    - MUST include a watermark text "登録販売者のくすり教室" on the top left.
    
    [Explanation to illustrate]
    {explanation}
    
    Output ONLY the English prompt string, nothing else. Focus on making the prompt compatible with Imagen 3.
    """
    
    payload = {
        "contents": [{"parts": [{"text": instruction}]}]
    }
    
    res = requests.post(url, headers=headers, json=payload)
    if res.status_code != 200:
        raise Exception(f"テキスト生成APIエラー: {res.text}")
        
    res_data = res.json()
    try:
        return res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print("プロンプト解析エラー:", res_data)
        raise e

def generate_image(api_key, image_prompt):
    # Imagen 3 API endpoint
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "instances": [{"prompt": image_prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "4:3"
        }
    }
    
    res = requests.post(url, headers=headers, json=payload)
    if res.status_code != 200:
        raise Exception(f"画像生成APIエラー: {res.text}")
        
    res_data = res.json()
    try:
        b64 = res_data["predictions"][0]["bytesBase64Encoded"]
        return base64.b64decode(b64)
    except Exception as e:
        print("画像解析エラー:", res_data)
        raise e

def main():
    if API_KEY == "ここにGemini APIキーを入力" or not API_KEY.strip():
        print("エラー: Gemini APIキーが設定されていません。スクリプト内の API_KEY を書き換えてください。")
        return

    if not os.path.exists(CHECK_DIR):
        print(f"確認用フォルダを作成します: {CHECK_DIR}")
        os.makedirs(CHECK_DIR, exist_ok=True)
        
    existing_files = []
    if os.path.exists(DIAGRAMS_DIR):
        existing_files = [f for f in os.listdir(DIAGRAMS_DIR) if f.endswith('.webp')]
        
    if not os.path.exists(CSV_PATH):
        print(f"エラー: CSVファイルが見つかりません。パスを確認してください: {CSV_PATH}")
        return

    tasks = []
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        
        id_idx = 0
        exp_idx = 1
        
        # ヘッダーから「問題番号/id」「解説/explanation」の列を推測
        if header:
            for i, h in enumerate(header):
                if 'id' in h.lower() or '番号' in h:
                    id_idx = i
                elif '解説' in h or 'explanation' in h.lower():
                    exp_idx = i
                    
        for row in reader:
            if len(row) <= max(id_idx, exp_idx):
                continue
            
            raw_id = row[id_idx].strip()
            # "Q123" -> "123" など数字だけを抽出
            q_num = ''.join(filter(str.isdigit, raw_id))
            if not q_num:
                continue
                
            explanation = row[exp_idx].strip()
            if not explanation:
                continue
                
            filename = f"q{q_num}.webp"
            if filename not in existing_files:
                tasks.append({"num": q_num, "filename": filename, "exp": explanation})
                
    if not tasks:
        print("生成すべき新しい画像（未生成の問題）はありません。")
        return
        
    print(f"画像生成対象: {len(tasks)}件")
    
    generated_count = 0
    first_flag = True
    
    for task in tasks:
        filename = task['filename']
        print(f"\n--- {filename} の処理を開始 ---")
        try:
            # 1. 画像生成用プロンプト作成（Gemini Pro/Flashによる翻訳+プロンプト化）
            print("1/3 英語の画像生成プロンプトを作成中...")
            image_prompt = generate_english_prompt(API_KEY, task['exp'])
            print(f"[{filename}] プロンプト: {image_prompt[:80]}...")
            
            # 2. 画像生成（Imagen 3）
            print("2/3 画像を生成中...")
            img_bytes = generate_image(API_KEY, image_prompt)
            print(f"[{filename}] 画像データ取得完了")
            
            # 3. リサイズとWebPとして保存
            print("3/3 1024x768にリサイズしてWebP形式で保存中...")
            image = Image.open(BytesIO(img_bytes))
            
            # 指定された1024x768にリサイズ
            resample_filter = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS
            image = image.resize((1024, 768), resample_filter)
            
            save_path = os.path.join(CHECK_DIR, filename)
            image.save(save_path, format="webp", quality=80)
            print(f"[{filename}] 保存完了: {save_path}")
            
            generated_count += 1
            
        except Exception as e:
            print(f"[{filename}] の処理中にエラーが発生したためスキップします: {e}")
            continue
            
        # 1枚目の確認ストップ処理
        if first_flag:
            first_flag = False
            print("\n=============================================")
            while True:
                ans = input(f"★ 1枚目({filename})を確認用フォルダ ({CHECK_DIR}) で確認してください。\n残りの処理を自動で続けますか？(y/n): ").strip().lower()
                if ans in ['y', 'yes', 'n', 'no']:
                    break
            if ans.startswith('n'):
                print("スクリプトを終了します。")
                break
            print("=============================================\n")
                
    print(f"\n完了：{generated_count}枚生成しました")

if __name__ == "__main__":
    main()
