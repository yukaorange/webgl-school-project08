/*
 * 画像のロードを監視するクラス
 * @param {NodeList} elements - 監視する画像の要素
 * @param {HTMLElement} log - ログを表示する要素
 * @param {HTMLElement} progress - プログレスバーの要素
 */
export class Loading {
  constructor(elements, log, progress, counter, callback) {
    this.lengthArray = [];
    this.loadedArray = [];
    this.sumLength = 0; //全ての画像の合計サイズ
    this.sumLoaded = 0; //全ての画像の合計ロード済みサイズ
    this.log = log;
    this.progress = progress;
    this.callback = callback;
    this.counter = counter;
    this.init(elements);
  }

  async init(elements) {
    //初めに全ての画像のContent-Lengthの値を取得する
    this.lengthArray = await Promise.all(
      [...elements].map(async (elm) => {
        return this.getLength(elm.dataset.src);
      })
    );

    this.loadedArray = [...Array(this.lengthArray.length)].map(() => 0);
    this.sumLength = this.sum(this.lengthArray);
    this.sumLoaded = this.sum(this.loadedArray);
    this.addLog(`合計 ${this.sum(this.lengthArray)} bytes のデータ`);

    //画像をロードする
    for (let i = 0; i < elements.length; i++) {
      setTimeout(
        () => {
          this.loadXHR(elements[i], i);
        },
        `${i * 100}`
      );
      console.log(`画像読み込み${i + 1}枚目完了`);
    }
  }

  sum(array) {
    return array.reduce(function (a, b) {
      return a + b;
    }, 0);
  }

  updateProgress(e, index) {
    this.loadedArray[index] = e.loaded;
    this.sumLoaded = this.sum(this.loadedArray);
    let percent = (this.sumLoaded / this.sumLength) * 100;
    percent = percent > 100 ? 100 : percent;
    this.countUp(percent);
    // this.progress.setAttribute("style", `width:${percent}%`);
    // this.progress.textContent = `now loading...${Math.floor(percent)}%`;
    this.addLog(`${e.type}: ${this.sumLoaded} bytes 受信済み`);
  }

  countUp(percent) {
    let hundred = this.counter.querySelector('.loading-count__digit--hundred');
    let ten = this.counter.querySelector('.loading-count__digit--ten');
    let one = this.counter.querySelector('.loading-count__digit--one');
    let hundreds = Math.floor(percent / 100 % 100);
    let tens = Math.floor(percent / 10 % 10);
    let ones = Math.floor(percent & 10);
    hundred.style.setProperty('--progress', hundreds);
    ten.style.setProperty('--progress', tens);
    one.style.setProperty('--progress', ones);
  }

  async updateProgressToFinal() {
    // this.progress.textContent = `now loading...100%`;
    // this.progress.setAttribute('style', `width:100%`);
    document.body.classList.add('loaded');
  }

  async executeCallback() {
    console.log('ロード完了→コールバック実行');
    await this.callback();
    await this.updateProgressToFinal();
  }

  addLog(text) {
    this.log.textContent = `${this.log.textContent}${text}\n`;
  }

  addListeners(xhr, elm, index) {
    xhr.addEventListener('loadstart', (e) => {
      this.updateProgress(e, index);
    });
    xhr.addEventListener('load', (e) => {
      this.updateProgress(e, index);
    });
    xhr.addEventListener('progress', (e) => {
      this.updateProgress(e, index);
    });
    xhr.addEventListener('error', (e) => {
      this.updateProgress(e, index);
    });
    xhr.addEventListener('abort', (e) => {
      this.updateProgress(e, index);
    });
    xhr.addEventListener('loadend', (e) => {
      this.updateProgress(e, index);
      if (xhr.readyState === xhr.DONE && xhr.status === 200) {
        //blobで読み込む場合
        //elm.src = URL.createObjectURL(xhr.response);
        //キャッシュがあるのでsrcにパスを書くだけでも問題なさそう（体感的な表示速度の違いが感じられない）
        elm.src = elm.dataset.src;

        this.addLog(`${index + 1} 枚目の画像の読み込みが完了`);

        if (this.sumLength === this.sumLoaded) {
          this.addLog('全ての画像のロード完了（描画が完了したわけではない）');
          this.executeCallback();
        }
      }
    });
  }

  getLength(url) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === xhr.HEADERS_RECEIVED) {
          //レスポンスヘッダからContent-Lengthの値を読み取る
          const contentLength = parseInt(xhr.getResponseHeader('Content-Length'));

          //ヘッダのみで、データの読み込みは行わない
          xhr.abort();

          resolve(contentLength);
        }
      });
      xhr.addEventListener('error', () => {
        reject(0);
      });
      xhr.open('GET', url);
      xhr.send();
    });
  }

  loadXHR(elm, index) {
    const xhr = new XMLHttpRequest();
    //blobで読み込む場合
    //xhr.responseType = 'blob';
    this.addListeners(xhr, elm, index);
    xhr.open('GET', elm.dataset.src);
    xhr.send();
  }
}
