// A-Frame コンポーネント定義
AFRAME.registerComponent('high-quality-texture', {
    init: function () {
        this.el.addEventListener('model-loaded', (e) => {
            const mesh = this.el.getObject3D('mesh');
            if (mesh) {
                mesh.traverse((node) => {
                    if (node.isMesh && node.material && node.material.map) {
                        node.material.map.generateMipmaps = false;
                        node.material.map.minFilter = THREE.LinearFilter;
                        node.material.map.magFilter = THREE.LinearFilter;
                        node.material.map.needsUpdate = true;
                    }
                });
            }
        });
    }
});

// 定数データ定義
const videoData = {
    'stamp-a-flag': { title: 'スポット1：校章スポット', src: 'jgvideo.mp4' },
    'stamp-b-flag': { title: 'スポット2：シューティングゲーム', src: 'GameVideo.mp4' },
    'stamp-c-flag': { title: 'スポット3：丸型スポット', src: 'jgvideo.mp4' }
};

const deptNames = {
    'stamp-a': '電子機械科',
    'stamp-b': '情報技術科',
    'stamp-c': '情報処理科',
    'stamp-d': '服飾デザイン科',
    'stamp-e': '食物調理科',
    'stamp-f': '流通経済科'
};

let clickCount = 0;
let clickTimer = null;
let nearLogTimeout = null;

// 画面制御関数
function startAR() {
    // 説明画面を隠す
    document.getElementById('explanation-screen').style.display = 'none';
    
    // A-Frameのシーンを取得して手動でMindARをスタートさせる
    const sceneEl = document.querySelector('a-scene');
    const arSystem = sceneEl.systems['mindar-image-system'];
    
    if (arSystem) {
        arSystem.start(); // ここで初めてカメラが起動する
    }
}

// モーダルを開くとき（初期表示では動画一覧をクリアして隠しておく）
function openCollection() {
    const listContainer = document.getElementById('collection-list');
    if (listContainer) {
        listContainer.innerHTML = ''; // 動画エリアを空にして非表示状態にする
    }
    document.getElementById('collection-modal').style.display = 'flex';
}

function closeCollection() {
    document.getElementById('collection-modal').style.display = 'none';
}

// 学科ボタンを押したときに動画を表示する関数
function selectDepartment(deptKey) {
    renderCollectionList(); // 学科選択後に動画リストを描画して表示
    
    // 必要に応じて選択された学科までスクロール
    const listContainer = document.getElementById('collection-list');
    if (listContainer) {
        listContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

function openDeptVideos(deptKey) {
    const modal = document.getElementById('dept-video-modal');
    const title = document.getElementById('dept-title');
    const list = document.getElementById('dept-video-list');
    
    if (title) title.textContent = `${deptNames[deptKey] || '学科'} の動画一覧`;
    
    if (list) {
        list.innerHTML = '';
        const isUnlocked = localStorage.getItem(`${deptKey}-flag`) === '1';
        
        const div = document.createElement('div');
        div.className = `video-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        if (isUnlocked) {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0 0 8px 0; color:#059669;">🔓 学科紹介動画</p>
                <video src="jgvideo.mp4" controls style="width:100%; border-radius:8px; display:block;"></video>
            `;
        } else {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0; color:#475569;">🔒 未解放の動画</p>
                <div class="secret-box">
                    <div class="secret-icon">❓</div>
                    <small style="color:#64748b; font-weight:bold;">ARマーカーを探して解放しよう！</small>
                </div>
            `;
        }
        list.appendChild(div);
    }
    
    document.getElementById('collection-modal').style.display = 'none';
    modal.style.display = 'flex';
}

function closeDeptVideos() {
    document.getElementById('dept-video-modal').style.display = 'none';
    document.getElementById('collection-modal').style.display = 'flex';
}

// 動画リストを描画・表示する関数
function renderCollectionList() {
    const listContainer = document.getElementById('collection-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    Object.keys(videoData).forEach(key => {
        const item = videoData[key];
        const isUnlocked = localStorage.getItem(key) === '1';

        const div = document.createElement('div');
        div.className = `video-item ${isUnlocked ? 'unlocked' : 'locked'}`;

        if (isUnlocked) {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0 0 8px 0; color:#059669;">🔓 ${item.title}</p>
                <video src="${item.src}" controls style="width:100%; border-radius:8px; display:block;"></video>
            `;
        } else {
            div.innerHTML = `
                <p style="font-weight:bold; margin:0; color:#475569;">🔒 ${item.title}</p>
                <div class="secret-box">
                    <div class="secret-icon">❓</div>
                    <small style="color:#64748b; font-weight:bold;">ARマーカーを探して解放しよう！</small>
                </div>
            `;
        }
        listContainer.appendChild(div);
    });
}

function handleTitleClick() {
    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount >= 5) {
        clickCount = 0;
        if (confirm('【開発者コマンド】スタンプと解放状況を全リセットしますか？')) {
            localStorage.removeItem('stamp-a-flag');
            localStorage.removeItem('stamp-b-flag');
            localStorage.removeItem('stamp-c-flag');
            localStorage.removeItem('stamp-a-done');
            localStorage.removeItem('stamp-b-done');
            localStorage.removeItem('stamp-c-done');

            renderCollectionList();
            alert('すべての進行状況をリセットしました！');
        }
    } else {
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 1500);
    }
}

// --- ⭐ 新規追加：近くのオブジェクト読み取り案内ログの表示 ---
function showNearObjectLog() {
    const logElem = document.getElementById('near-object-log');
    if (!logElem) return;

    logElem.classList.add('show');

    // 10秒経過したら自動で引き込ませる
    clearTimeout(nearLogTimeout);
    nearLogTimeout = setTimeout(() => {
        logElem.classList.remove('show');
    }, 10000);
}

// --- ⭐ 新規追加：test.html（マーカーレス/ターゲット認識AR）へ切り替え ---
function switchToMarkerless() {
    window.location.href = 'test.html';
}

// --- ARマーカー検知イベント設定 ---
window.addEventListener('DOMContentLoaded', () => {
    const markers = document.querySelectorAll('a-marker');

    markers.forEach(marker => {
        marker.addEventListener('markerFound', function() {
            console.log("検出成功:", this.id);

            const videoAttr = this.querySelector('a-video');
            const video = videoAttr ? document.querySelector(videoAttr.getAttribute('src')) : null;

            // 動画解放フラグの記録（ここで動画閲覧実績をつける）
            if (this.id === 'ar-marker-1') {
                localStorage.setItem('stamp-a-flag', '1');
            } else if (this.id === 'ar-marker-2') {
                localStorage.setItem('stamp-b-flag', '1');
            } else if (this.id === 'ar-marker-3') {
                localStorage.setItem('stamp-c-flag', '1');
            }

            // モーダルが開いている場合は動画リストを再描画
            const modal = document.getElementById('collection-modal');
            if (modal && modal.style.display === 'flex') {
                renderCollectionList();
            }

            // 1. マーカー動画の再生
            if (video) {
                video.currentTime = 0;
                video.muted = false;
                video.play().catch(e => console.log('動画再生エラー:', e));
            }

            // 2. ⭐ マーカー認識から1.5秒後に「近くに読み取れるものがあるかも…」ログを表示
            // （スタンプダイアログは出さず、ここからtest.htmlへ遷移させます）
            setTimeout(() => {
                showNearObjectLog();
            }, 1500);
        });

       marker.addEventListener('markerLost', function() {
    // タイマーのクリアだけを行い、表示されているモーダルやボタンは消さない
    clearTimeout(markerTimers[this.id]);

    const videoAttr = this.querySelector('a-video');
    const video = videoAttr ? document.querySelector(videoAttr.getAttribute('src')) : null;
    if (video) {
        video.pause();
         }
        });
    });
});
