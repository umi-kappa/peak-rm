// showModal() のダイアログは top layer に出るため、インライン描画では Docs ページ上で
// 全 story が重なる。story ごとに iframe を分けて top layer を隔離する。
// dialog 系 stories の parameters.docs.story に共通で使い、高さだけ story 側の関心として受け取る。
export function topLayerDocs(iframeHeight: number) {
  return { inline: false, iframeHeight }
}
