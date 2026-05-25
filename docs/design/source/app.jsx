// PeakRM Hi-Fi · canvas entry

const App = () => (
  <DesignCanvas>
    <DCSection
      id="screens"
      title="PeakRM ・ Hi-Fi Screens"
      subtitle="ダーク基調 ・ オフホワイト主体 ・ アクセントは CTA/1RM/タイマーに絞って差し込む ・ ヒーロー数値にネオングロー"
    >
      <DCArtboard id="m-home" label="01 Home" width={390} height={800}><M_Home /></DCArtboard>
      <DCArtboard id="m-home-empty" label="01 Home (記録なし)" width={390} height={800}><M_Home empty /></DCArtboard>
      <DCArtboard id="m-menu" label="02 Menu setup" width={390} height={840}><M_Menu /></DCArtboard>
      <DCArtboard id="m-training" label="03a Training" width={390} height={800}><M_TrainingSet /></DCArtboard>
      <DCArtboard id="m-training-final" label="03a Training (最終セット)" width={390} height={800}><M_TrainingSet final /></DCArtboard>
      <DCArtboard id="m-interval" label="03b Interval" width={390} height={920}><M_Interval /></DCArtboard>
      <DCArtboard id="m-result" label="04 Result (完走)" width={390} height={860}><M_Result perfect /></DCArtboard>
      <DCArtboard id="m-result-partial" label="04 Result (一部未達)" width={390} height={860}><M_Result /></DCArtboard>
      <DCArtboard id="m-result-aborted" label="04 Result (中断)" width={390} height={860}><M_Result aborted /></DCArtboard>
      <DCArtboard id="m-modal" label="セット編集モーダル" width={390} height={800}><M_Modal /></DCArtboard>
      <DCArtboard id="m-history" label="05 History" width={390} height={860}><M_History /></DCArtboard>
      <DCArtboard id="m-history-detail" label="05a History detail" width={390} height={860}><M_Result fromHistory /></DCArtboard>
      <DCArtboard id="m-settings" label="06 Settings" width={390} height={800}><M_Settings /></DCArtboard>
    </DCSection>

    <DCSection
      id="tokens"
      title="Design Tokens"
      subtitle="現状のデザインで使っている色 / フォントサイズ / ウエイト / 余白 / 角丸の一覧"
    >
      <DCArtboard id="tokens-card" label="Tokens" width={1164} height={1640}><DesignTokens /></DCArtboard>
    </DCSection>

    <DCPostIt x={40} y={40} w={280}>
      方針まとめ：{'\n'}・ダーク基調 (#0a0a0b){'\n'}・サンセリフ + モノ数字{'\n'}・8 px グリッド ・ 390 px ベース{'\n'}・種目名・ラベル・ボタンは英語、メモは日本語{'\n'}・アクセント Cyan #22e8ff
    </DCPostIt>
  </DesignCanvas>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
