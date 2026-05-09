# Firebase設定手順

このアプリは `firebase-config.js` にFirebase Webアプリの設定を入れると、Cloud Firestoreで名簿と出欠を共有保存します。

## 1. Firebaseプロジェクトを作成

1. Firebase Consoleを開く
2. プロジェクトを作成
3. `構築` → `Firestore Database` を開く
4. データベースを作成
5. ロケーションを選択
6. まずはテスト用に開始

## 2. Webアプリを追加

1. プロジェクト設定を開く
2. `マイアプリ` でWebアプリを追加
3. 表示された `firebaseConfig` をコピー
4. `firebase-config.js` に貼り付ける

```js
export const firebaseConfig = {
  apiKey: "xxxxxxxx",
  authDomain: "xxxxxxxx.firebaseapp.com",
  projectId: "xxxxxxxx",
  storageBucket: "xxxxxxxx.firebasestorage.app",
  messagingSenderId: "xxxxxxxx",
  appId: "xxxxxxxx",
};
```

FirebaseのWeb APIキーはプロジェクト識別用で、Firebase Security Rulesで権限を管理します。

## 3. Firestoreルール

最初に動作確認するだけなら、Firestoreの `ルール` に以下を設定します。

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /attendanceApps/default {
      allow read, write: if true;
    }
  }
}
```

このルールはURLを知っている人なら読み書きできます。本番運用ではログイン機能を追加し、管理者だけが名簿編集できるルールに変更してください。

## 4. Firebase Hostingで公開

このリポジトリでは `firebase.json` で公開フォルダを `public` にしています。Firebase Hostingへアップロードされるのは `public` 内のファイルだけです。

```bash
firebase deploy --only hosting
```

`firebase init hosting` をやり直す場合は、公開フォルダを必ず `public` にしてください。

```txt
What do you want to use as your public directory?
public
```

## 5. GitHubへ反映

`firebase-config.js` を更新したら、GitHubへpushします。

```bash
cp index.html styles.css app.js firebase-config.js public/
git add index.html styles.css app.js firebase-config.js firebase.json public FIREBASE_SETUP.md
git commit -m "Add Firebase sync"
git push
```

GitHub PagesまたはRenderが自動デプロイされる設定なら、数分後に反映されます。
