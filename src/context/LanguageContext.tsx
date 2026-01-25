import React, { createContext, useContext, ReactNode } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { usePreferences } from '../hooks/usePreferences';

// Define supported languages
export type Language = 'en' | 'ru' | 'es' | 'de' | 'fr' | 'pt' | 'ja' | 'zh' | 'ko' | 'uk';

// Translation resources
const resources = {
  en: {
    translation: {
      // Common
      app_name: 'Text to Slides',
      continue: 'Continue',
      cancel: 'Cancel',
      save: 'Save',
      export: 'Export',
      
      // Splash Screen
      splash_title: 'Text to Slides',
      splash_subtitle: 'Creating beautiful slides from your text',
      
      // New Project Screen
      new_project_title: 'New Project',

      // Home Screen
      home_title: 'Create Slides',
      home_subtitle: 'Enter your text below to generate slides',
      home_placeholder: 'Enter your text here...',
      home_generate_button: 'Generate Slides',
      home_character_count: 'Characters: {{count}}',
      home_start_typing: 'Start typing to see character count',
      home_error_empty: 'Please enter some text to generate slides',
      
      // Image Selection Screen
      image_selection_title: 'Select Images',
      image_selection_subtitle: 'Choose background images for your {{count}} slide{{plural}}',
      image_selection_slide: 'Slide {{number}}',
      image_selection_select_image: 'Select Image',
      image_selection_plain_background: 'Plain Background',
      image_selection_image_selected: 'Image selected',
      image_selection_plain_selected: 'Plain background selected',
      image_selection_no_image: 'No image selected',
      image_selection_continue: 'Continue to Editor',
      image_selection_error: 'Please select {{count}} images for your slides',
      image_selection_error_title: 'Error',
      image_selection_error_select_failed: 'Failed to select image. Please try again.',
      
      // Editor Screen
      editor_title: 'Slide Editor',
      editor_slide: 'Slide {{current}} of {{total}}',
      editor_position: 'Text Position',
      editor_size: 'Text Size',
      editor_preview: 'Preview Slides',
      editor_move_up: 'Move Up',
      editor_move_down: 'Move Down',
      editor_move_left: 'Move Left',
      editor_move_right: 'Move Right',
      editor_increase_size: 'Increase Size',
      editor_decrease_size: 'Decrease Size',
      
      // Preview Screen
      preview_title: 'Preview',
      preview_export: 'Export Slides',
      preview_success: 'Slides exported successfully!',
      preview_empty: 'No slides to preview',
      
      // Settings Screen
      settings_title: 'Settings',
      settings_theme: 'Theme',
      settings_language: 'Language',
      settings_sound: 'Sound',
      settings_haptics: 'Haptics',

      // Speech Recognition
      speech_permission_denied: 'Permission Required',
      speech_permission_settings: 'Please enable microphone access in Settings.',
      speech_not_available: 'Not Available',
      speech_not_available_message: 'Speech recognition is not available on this device.',
      speech_error: 'Speech recognition error occurred. Please try again.',
    },
  },
  ru: {
    translation: {
      // Common
      app_name: 'Текст в Слайды',
      continue: 'Продолжить',
      cancel: 'Отмена',
      save: 'Сохранить',
      export: 'Экспорт',
      
      // Splash Screen
      splash_title: 'Текст в Слайды',
      splash_subtitle: 'Создание красивых слайдов из вашего текста',
      
      // New Project Screen
      new_project_title: 'Новый проект',

      // Home Screen
      home_title: 'Создать слайды',
      home_subtitle: 'Введите текст ниже, чтобы создать слайды',
      home_placeholder: 'Введите ваш текст здесь...',
      home_generate_button: 'Создать слайды',
      home_character_count: 'Символов: {{count}}',
      home_start_typing: 'Начните печатать, чтобы увидеть количество символов',
      home_error_empty: 'Пожалуйста, введите текст для создания слайдов',
      
      // Image Selection Screen
      image_selection_title: 'Выберите изображения',
      image_selection_subtitle: 'Выберите фоновые изображения для {{count}} слайда{{plural}}',
      image_selection_slide: 'Слайд {{number}}',
      image_selection_select_image: 'Выбрать изображение',
      image_selection_plain_background: 'Простой фон',
      image_selection_image_selected: 'Изображение выбрано',
      image_selection_plain_selected: 'Выбран простой фон',
      image_selection_no_image: 'Изображение не выбрано',
      image_selection_continue: 'Перейти к редактору',
      image_selection_error: 'Пожалуйста, выберите {{count}} изображений для ваших слайдов',
      image_selection_error_title: 'Ошибка',
      image_selection_error_select_failed: 'Не удалось выбрать изображение. Попробуйте еще раз.',
      
      // Editor Screen
      editor_title: 'Редактор слайдов',
      editor_slide: 'Слайд {{current}} из {{total}}',
      editor_position: 'Позиция текста',
      editor_size: 'Размер текста',
      editor_preview: 'Предварительный просмотр',
      editor_move_up: 'Переместить вверх',
      editor_move_down: 'Переместить вниз',
      editor_move_left: 'Переместить влево',
      editor_move_right: 'Переместить вправо',
      editor_increase_size: 'Увеличить размер',
      editor_decrease_size: 'Уменьшить размер',
      
      // Preview Screen
      preview_title: 'Предварительный просмотр',
      preview_export: 'Экспортировать слайды',
      preview_success: 'Слайды успешно экспортированы!',
      preview_empty: 'Нет слайдов для предварительного просмотра',
      
      // Settings Screen
      settings_title: 'Настройки',
      settings_theme: 'Тема',
      settings_language: 'Язык',
      settings_sound: 'Звук',
      settings_haptics: 'Вибрация',

      // Speech Recognition
      speech_permission_denied: 'Требуется разрешение',
      speech_permission_settings: 'Пожалуйста, включите доступ к микрофону в Настройках.',
      speech_not_available: 'Недоступно',
      speech_not_available_message: 'Распознавание речи недоступно на этом устройстве.',
      speech_error: 'Ошибка распознавания речи. Попробуйте еще раз.',
    },
  },
  de: {
    translation: {
      // Common
      app_name: 'Text zu Folien',
      continue: 'Weiter',
      cancel: 'Abbrechen',
      save: 'Speichern',
      export: 'Exportieren',
      
      // Splash Screen
      splash_title: 'Text zu Folien',
      splash_subtitle: 'Erstellen schöner Folien aus Ihrem Text',
      
      // New Project Screen
      new_project_title: 'Neues Projekt',

      // Home Screen
      home_title: 'Folien erstellen',
      home_subtitle: 'Geben Sie Ihren Text unten ein, um Folien zu generieren',
      home_placeholder: 'Geben Sie Ihren Text hier ein...',
      home_generate_button: 'Folien generieren',
      home_character_count: 'Zeichen: {{count}}',
      home_start_typing: 'Beginnen Sie mit der Eingabe, um die Zeichenanzahl zu sehen',
      home_error_empty: 'Bitte geben Sie Text ein, um Folien zu generieren',
      
      // Image Selection Screen
      image_selection_title: 'Bilder auswählen',
      image_selection_subtitle: 'Wählen Sie Hintergrundbilder für {{count}} Folie{{plural}}',
      image_selection_slide: 'Folie {{number}}',
      image_selection_select_image: 'Bild auswählen',
      image_selection_plain_background: 'Einfacher Hintergrund',
      image_selection_image_selected: 'Bild ausgewählt',
      image_selection_plain_selected: 'Einfacher Hintergrund ausgewählt',
      image_selection_no_image: 'Kein Bild ausgewählt',
      image_selection_continue: 'Zum Editor fortfahren',
      image_selection_error: 'Bitte wählen Sie {{count}} Bilder für Ihre Folien aus',
      image_selection_error_title: 'Fehler',
      image_selection_error_select_failed: 'Bildauswahl fehlgeschlagen. Bitte versuchen Sie es erneut.',
      
      // Editor Screen
      editor_title: 'Folien-Editor',
      editor_slide: 'Folie {{current}} von {{total}}',
      editor_position: 'Textposition',
      editor_size: 'Textgröße',
      editor_preview: 'Folien-Vorschau',
      editor_move_up: 'Nach oben bewegen',
      editor_move_down: 'Nach unten bewegen',
      editor_move_left: 'Nach links bewegen',
      editor_move_right: 'Nach rechts bewegen',
      editor_increase_size: 'Größe erhöhen',
      editor_decrease_size: 'Größe verringern',
      
      // Preview Screen
      preview_title: 'Vorschau',
      preview_export: 'Folien exportieren',
      preview_success: 'Folien erfolgreich exportiert!',
      preview_empty: 'Keine Folien zur Vorschau',
      
      // Settings Screen
      settings_title: 'Einstellungen',
      settings_theme: 'Design',
      settings_language: 'Sprache',
      settings_sound: 'Ton',
      settings_haptics: 'Haptik',

      // Speech Recognition
      speech_permission_denied: 'Berechtigung erforderlich',
      speech_permission_settings: 'Bitte aktivieren Sie den Mikrofonzugriff in den Einstellungen.',
      speech_not_available: 'Nicht verfügbar',
      speech_not_available_message: 'Spracherkennung ist auf diesem Gerät nicht verfügbar.',
      speech_error: 'Fehler bei der Spracherkennung. Bitte versuchen Sie es erneut.',
    },
  },
  fr: {
    translation: {
      // Common
      app_name: 'Texte en Diapositives',
      continue: 'Continuer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      export: 'Exporter',
      
      // Splash Screen
      splash_title: 'Texte en Diapositives',
      splash_subtitle: 'Création de belles diapositives à partir de votre texte',
      
      // New Project Screen
      new_project_title: 'Nouveau projet',

      // Home Screen
      home_title: 'Créer des diapositives',
      home_subtitle: 'Entrez votre texte ci-dessous pour générer des diapositives',
      home_placeholder: 'Entrez votre texte ici...',
      home_generate_button: 'Générer des diapositives',
      home_character_count: 'Caractères: {{count}}',
      home_start_typing: 'Commencez à taper pour voir le nombre de caractères',
      home_error_empty: 'Veuillez entrer du texte pour générer des diapositives',
      
      // Image Selection Screen
      image_selection_title: 'Sélectionner des images',
      image_selection_subtitle: 'Choisissez des images de fond pour {{count}} diapositive{{plural}}',
      image_selection_slide: 'Diapositive {{number}}',
      image_selection_select_image: 'Sélectionner une image',
      image_selection_plain_background: 'Arrière-plan uni',
      image_selection_image_selected: 'Image sélectionnée',
      image_selection_plain_selected: 'Arrière-plan uni sélectionné',
      image_selection_no_image: 'Aucune image sélectionnée',
      image_selection_continue: 'Continuer vers l\'éditeur',
      image_selection_error: 'Veuillez sélectionner {{count}} images pour vos diapositives',
      image_selection_error_title: 'Erreur',
      image_selection_error_select_failed: 'Échec de la sélection d\'image. Veuillez réessayer.',
      
      // Editor Screen
      editor_title: 'Éditeur de diapositives',
      editor_slide: 'Diapositive {{current}} sur {{total}}',
      editor_position: 'Position du texte',
      editor_size: 'Taille du texte',
      editor_preview: 'Aperçu des diapositives',
      editor_move_up: 'Déplacer vers le haut',
      editor_move_down: 'Déplacer vers le bas',
      editor_move_left: 'Déplacer vers la gauche',
      editor_move_right: 'Déplacer vers la droite',
      editor_increase_size: 'Augmenter la taille',
      editor_decrease_size: 'Diminuer la taille',
      
      // Preview Screen
      preview_title: 'Aperçu',
      preview_export: 'Exporter les diapositives',
      preview_success: 'Diapositives exportées avec succès!',
      preview_empty: 'Aucune diapositive à prévisualiser',
      
      // Settings Screen
      settings_title: 'Paramètres',
      settings_theme: 'Thème',
      settings_language: 'Langue',
      settings_sound: 'Son',
      settings_haptics: 'Haptique',

      // Speech Recognition
      speech_permission_denied: 'Autorisation requise',
      speech_permission_settings: 'Veuillez activer l\'accès au microphone dans les Réglages.',
      speech_not_available: 'Non disponible',
      speech_not_available_message: 'La reconnaissance vocale n\'est pas disponible sur cet appareil.',
      speech_error: 'Erreur de reconnaissance vocale. Veuillez réessayer.',
    },
  },
  pt: {
    translation: {
      // Common
      app_name: 'Texto para Slides',
      continue: 'Continuar',
      cancel: 'Cancelar',
      save: 'Salvar',
      export: 'Exportar',
      
      // Splash Screen
      splash_title: 'Texto para Slides',
      splash_subtitle: 'Criando slides bonitos a partir do seu texto',
      
      // New Project Screen
      new_project_title: 'Novo Projeto',

      // Home Screen
      home_title: 'Criar Slides',
      home_subtitle: 'Digite seu texto abaixo para gerar slides',
      home_placeholder: 'Digite seu texto aqui...',
      home_generate_button: 'Gerar Slides',
      home_character_count: 'Caracteres: {{count}}',
      home_start_typing: 'Comece a digitar para ver a contagem de caracteres',
      home_error_empty: 'Por favor, digite texto para gerar slides',
      
      // Image Selection Screen
      image_selection_title: 'Selecionar Imagens',
      image_selection_subtitle: 'Escolha imagens de fundo para {{count}} slide{{plural}}',
      image_selection_slide: 'Slide {{number}}',
      image_selection_select_image: 'Selecionar Imagem',
      image_selection_plain_background: 'Fundo Simples',
      image_selection_image_selected: 'Imagem selecionada',
      image_selection_plain_selected: 'Fundo simples selecionado',
      image_selection_no_image: 'Nenhuma imagem selecionada',
      image_selection_continue: 'Continuar para o Editor',
      image_selection_error: 'Por favor, selecione {{count}} imagens para seus slides',
      image_selection_error_title: 'Erro',
      image_selection_error_select_failed: 'Falha ao selecionar imagem. Tente novamente.',
      
      // Editor Screen
      editor_title: 'Editor de Slides',
      editor_slide: 'Slide {{current}} de {{total}}',
      editor_position: 'Posição do Texto',
      editor_size: 'Tamanho do Texto',
      editor_preview: 'Visualizar Slides',
      editor_move_up: 'Mover para Cima',
      editor_move_down: 'Mover para Baixo',
      editor_move_left: 'Mover para Esquerda',
      editor_move_right: 'Mover para Direita',
      editor_increase_size: 'Aumentar Tamanho',
      editor_decrease_size: 'Diminuir Tamanho',
      
      // Preview Screen
      preview_title: 'Visualização',
      preview_export: 'Exportar Slides',
      preview_success: 'Slides exportados com sucesso!',
      preview_empty: 'Nenhum slide para visualizar',
      
      // Settings Screen
      settings_title: 'Configurações',
      settings_theme: 'Tema',
      settings_language: 'Idioma',
      settings_sound: 'Som',
      settings_haptics: 'Háptico',

      // Speech Recognition
      speech_permission_denied: 'Permissão Necessária',
      speech_permission_settings: 'Por favor, ative o acesso ao microfone nas Configurações.',
      speech_not_available: 'Não Disponível',
      speech_not_available_message: 'O reconhecimento de voz não está disponível neste dispositivo.',
      speech_error: 'Erro no reconhecimento de voz. Tente novamente.',
    },
  },
  ja: {
    translation: {
      // Common
      app_name: 'テキストをスライドに',
      continue: '続行',
      cancel: 'キャンセル',
      save: '保存',
      export: 'エクスポート',
      
      // Splash Screen
      splash_title: 'テキストをスライドに',
      splash_subtitle: 'テキストから美しいスライドを作成',
      
      // New Project Screen
      new_project_title: '新規プロジェクト',

      // Home Screen
      home_title: 'スライドを作成',
      home_subtitle: '下にテキストを入力してスライドを生成',
      home_placeholder: 'ここにテキストを入力...',
      home_generate_button: 'スライドを生成',
      home_character_count: '文字数: {{count}}',
      home_start_typing: '入力開始で文字数を表示',
      home_error_empty: 'スライドを生成するためにテキストを入力してください',
      
      // Image Selection Screen
      image_selection_title: '画像を選択',
      image_selection_subtitle: '{{count}}枚のスライド{{plural}}の背景画像を選択',
      image_selection_slide: 'スライド {{number}}',
      image_selection_select_image: '画像を選択',
      image_selection_plain_background: 'プレーン背景',
      image_selection_image_selected: '画像が選択されました',
      image_selection_plain_selected: 'プレーン背景が選択されました',
      image_selection_no_image: '画像が選択されていません',
      image_selection_continue: 'エディターに続行',
      image_selection_error: 'スライドのために{{count}}枚の画像を選択してください',
      image_selection_error_title: 'エラー',
      image_selection_error_select_failed: '画像の選択に失敗しました。もう一度お試しください。',
      
      // Editor Screen
      editor_title: 'スライドエディター',
      editor_slide: '{{total}}枚中{{current}}枚目',
      editor_position: 'テキスト位置',
      editor_size: 'テキストサイズ',
      editor_preview: 'スライドをプレビュー',
      editor_move_up: '上に移動',
      editor_move_down: '下に移動',
      editor_move_left: '左に移動',
      editor_move_right: '右に移動',
      editor_increase_size: 'サイズを増加',
      editor_decrease_size: 'サイズを減少',
      
      // Preview Screen
      preview_title: 'プレビュー',
      preview_export: 'スライドをエクスポート',
      preview_success: 'スライドが正常にエクスポートされました！',
      preview_empty: 'プレビューするスライドがありません',
      
      // Settings Screen
      settings_title: '設定',
      settings_theme: 'テーマ',
      settings_language: '言語',
      settings_sound: '音',
      settings_haptics: 'ハプティック',

      // Speech Recognition
      speech_permission_denied: '許可が必要です',
      speech_permission_settings: '設定でマイクへのアクセスを有効にしてください。',
      speech_not_available: '利用不可',
      speech_not_available_message: 'このデバイスでは音声認識が利用できません。',
      speech_error: '音声認識エラーが発生しました。もう一度お試しください。',
    },
  },
  zh: {
    translation: {
      // Common
      app_name: '文本转幻灯片',
      continue: '继续',
      cancel: '取消',
      save: '保存',
      export: '导出',
      
      // Splash Screen
      splash_title: '文本转幻灯片',
      splash_subtitle: '从您的文本创建精美的幻灯片',
      
      // New Project Screen
      new_project_title: '新项目',

      // Home Screen
      home_title: '创建幻灯片',
      home_subtitle: '在下方输入文本以生成幻灯片',
      home_placeholder: '在此输入您的文本...',
      home_generate_button: '生成幻灯片',
      home_character_count: '字符数: {{count}}',
      home_start_typing: '开始输入以查看字符数',
      home_error_empty: '请输入文本以生成幻灯片',
      
      // Image Selection Screen
      image_selection_title: '选择图片',
      image_selection_subtitle: '为{{count}}张幻灯片{{plural}}选择背景图片',
      image_selection_slide: '幻灯片 {{number}}',
      image_selection_select_image: '选择图片',
      image_selection_plain_background: '纯色背景',
      image_selection_image_selected: '已选择图片',
      image_selection_plain_selected: '已选择纯色背景',
      image_selection_no_image: '未选择图片',
      image_selection_continue: '继续到编辑器',
      image_selection_error: '请为您的幻灯片选择{{count}}张图片',
      image_selection_error_title: '错误',
      image_selection_error_select_failed: '选择图片失败。请重试。',
      
      // Editor Screen
      editor_title: '幻灯片编辑器',
      editor_slide: '第{{current}}张，共{{total}}张',
      editor_position: '文本位置',
      editor_size: '文本大小',
      editor_preview: '预览幻灯片',
      editor_move_up: '向上移动',
      editor_move_down: '向下移动',
      editor_move_left: '向左移动',
      editor_move_right: '向右移动',
      editor_increase_size: '增大尺寸',
      editor_decrease_size: '减小尺寸',
      
      // Preview Screen
      preview_title: '预览',
      preview_export: '导出幻灯片',
      preview_success: '幻灯片导出成功！',
      preview_empty: '没有幻灯片可预览',
      
      // Settings Screen
      settings_title: '设置',
      settings_theme: '主题',
      settings_language: '语言',
      settings_sound: '声音',
      settings_haptics: '触觉反馈',

      // Speech Recognition
      speech_permission_denied: '需要权限',
      speech_permission_settings: '请在设置中启用麦克风访问权限。',
      speech_not_available: '不可用',
      speech_not_available_message: '此设备不支持语音识别。',
      speech_error: '语音识别错误。请重试。',
    },
  },
  ko: {
    translation: {
      // Common
      app_name: '텍스트를 슬라이드로',
      continue: '계속',
      cancel: '취소',
      save: '저장',
      export: '내보내기',
      
      // Splash Screen
      splash_title: '텍스트를 슬라이드로',
      splash_subtitle: '텍스트로 아름다운 슬라이드 만들기',
      
      // New Project Screen
      new_project_title: '새 프로젝트',

      // Home Screen
      home_title: '슬라이드 만들기',
      home_subtitle: '아래에 텍스트를 입력하여 슬라이드를 생성하세요',
      home_placeholder: '여기에 텍스트를 입력하세요...',
      home_generate_button: '슬라이드 생성',
      home_character_count: '문자 수: {{count}}',
      home_start_typing: '입력을 시작하면 문자 수를 볼 수 있습니다',
      home_error_empty: '슬라이드를 생성하려면 텍스트를 입력해주세요',
      
      // Image Selection Screen
      image_selection_title: '이미지 선택',
      image_selection_subtitle: '{{count}}개의 슬라이드{{plural}}에 대한 배경 이미지를 선택하세요',
      image_selection_slide: '슬라이드 {{number}}',
      image_selection_select_image: '이미지 선택',
      image_selection_plain_background: '단색 배경',
      image_selection_image_selected: '이미지가 선택되었습니다',
      image_selection_plain_selected: '단색 배경이 선택되었습니다',
      image_selection_no_image: '이미지가 선택되지 않았습니다',
      image_selection_continue: '편집기로 계속',
      image_selection_error: '슬라이드를 위해 {{count}}개의 이미지를 선택해주세요',
      image_selection_error_title: '오류',
      image_selection_error_select_failed: '이미지 선택에 실패했습니다. 다시 시도해주세요.',
      
      // Editor Screen
      editor_title: '슬라이드 편집기',
      editor_slide: '{{total}}개 중 {{current}}개',
      editor_position: '텍스트 위치',
      editor_size: '텍스트 크기',
      editor_preview: '슬라이드 미리보기',
      editor_move_up: '위로 이동',
      editor_move_down: '아래로 이동',
      editor_move_left: '왼쪽으로 이동',
      editor_move_right: '오른쪽으로 이동',
      editor_increase_size: '크기 증가',
      editor_decrease_size: '크기 감소',
      
      // Preview Screen
      preview_title: '미리보기',
      preview_export: '슬라이드 내보내기',
      preview_success: '슬라이드가 성공적으로 내보내졌습니다!',
      preview_empty: '미리볼 슬라이드가 없습니다',
      
      // Settings Screen
      settings_title: '설정',
      settings_theme: '테마',
      settings_language: '언어',
      settings_sound: '소리',
      settings_haptics: '햅틱 피드백',

      // Speech Recognition
      speech_permission_denied: '권한 필요',
      speech_permission_settings: '설정에서 마이크 접근을 활성화해 주세요.',
      speech_not_available: '사용 불가',
      speech_not_available_message: '이 기기에서는 음성 인식을 사용할 수 없습니다.',
      speech_error: '음성 인식 오류가 발생했습니다. 다시 시도해 주세요.',
    },
  },
  uk: {
    translation: {
      // Common
      app_name: 'Текст у Слайди',
      continue: 'Продовжити',
      cancel: 'Скасувати',
      save: 'Зберегти',
      export: 'Експорт',
      
      // Splash Screen
      splash_title: 'Текст у Слайди',
      splash_subtitle: 'Створення красивих слайдів з вашого тексту',
      
      // New Project Screen
      new_project_title: 'Новий проект',

      // Home Screen
      home_title: 'Створити слайди',
      home_subtitle: 'Введіть текст нижче, щоб створити слайди',
      home_placeholder: 'Введіть ваш текст тут...',
      home_generate_button: 'Створити слайди',
      home_character_count: 'Символів: {{count}}',
      home_start_typing: 'Почніть друкувати, щоб побачити кількість символів',
      home_error_empty: 'Будь ласка, введіть текст для створення слайдів',
      
      // Image Selection Screen
      image_selection_title: 'Вибрати зображення',
      image_selection_subtitle: 'Виберіть фонові зображення для {{count}} слайда{{plural}}',
      image_selection_slide: 'Слайд {{number}}',
      image_selection_select_image: 'Вибрати зображення',
      image_selection_plain_background: 'Простий фон',
      image_selection_image_selected: 'Зображення вибрано',
      image_selection_plain_selected: 'Вибрано простий фон',
      image_selection_no_image: 'Зображення не вибрано',
      image_selection_continue: 'Перейти до редактора',
      image_selection_error: 'Будь ласка, виберіть {{count}} зображень для ваших слайдів',
      image_selection_error_title: 'Помилка',
      image_selection_error_select_failed: 'Не вдалося вибрати зображення. Спробуйте ще раз.',
      
      // Editor Screen
      editor_title: 'Редактор слайдів',
      editor_slide: 'Слайд {{current}} з {{total}}',
      editor_position: 'Позиція тексту',
      editor_size: 'Розмір тексту',
      editor_preview: 'Попередній перегляд',
      editor_move_up: 'Перемістити вгору',
      editor_move_down: 'Перемістити вниз',
      editor_move_left: 'Перемістити вліво',
      editor_move_right: 'Перемістити вправо',
      editor_increase_size: 'Збільшити розмір',
      editor_decrease_size: 'Зменшити розмір',
      
      // Preview Screen
      preview_title: 'Попередній перегляд',
      preview_export: 'Експортувати слайди',
      preview_success: 'Слайди успішно експортовано!',
      preview_empty: 'Немає слайдів для попереднього перегляду',
      
      // Settings Screen
      settings_title: 'Налаштування',
      settings_theme: 'Тема',
      settings_language: 'Мова',
      settings_sound: 'Звук',
      settings_haptics: 'Вібрація',

      // Speech Recognition
      speech_permission_denied: 'Потрібен дозвіл',
      speech_permission_settings: 'Будь ласка, увімкніть доступ до мікрофона в Налаштуваннях.',
      speech_not_available: 'Недоступно',
      speech_not_available_message: 'Розпізнавання мовлення недоступне на цьому пристрої.',
      speech_error: 'Помилка розпізнавання мовлення. Спробуйте ще раз.',
    },
  },
  es: {
    translation: {
      app_name: 'Texto a Diapositivas',
      continue: 'Continuar',
      cancel: 'Cancelar',
      save: 'Guardar',
      export: 'Exportar',
      splash_title: 'Texto a Diapositivas',
      splash_subtitle: 'Creando diapositivas hermosas a partir de tu texto',
      // New Project Screen
      new_project_title: 'Nuevo Proyecto',

      home_title: 'Crear Diapositivas',
      home_subtitle: 'Ingresa tu texto abajo para generar diapositivas',
      home_placeholder: 'Ingresa tu texto aquí...',
      home_generate_button: 'Generar Diapositivas',
      home_character_count: 'Caracteres: {{count}}',
      home_start_typing: 'Empieza a escribir para ver el conteo de caracteres',
      home_error_empty: 'Por favor ingresa texto para generar diapositivas',
      image_selection_title: 'Seleccionar Imágenes',
      image_selection_subtitle: 'Elige imágenes de fondo para {{count}} diapositiva{{plural}}',
      image_selection_slide: 'Diapositiva {{number}}',
      image_selection_select_image: 'Seleccionar Imagen',
      image_selection_plain_background: 'Fondo Plano',
      image_selection_image_selected: 'Imagen seleccionada',
      image_selection_plain_selected: 'Fondo plano seleccionado',
      image_selection_no_image: 'Ninguna imagen seleccionada',
      image_selection_continue: 'Continuar al Editor',
      image_selection_error: 'Por favor selecciona {{count}} imágenes para tus diapositivas',
      image_selection_error_title: 'Error',
      image_selection_error_select_failed: 'Error al seleccionar imagen. Inténtalo de nuevo.',
      editor_title: 'Editor de Diapositivas',
      editor_slide: 'Diapositiva {{current}} de {{total}}',
      editor_position: 'Posición del Texto',
      editor_size: 'Tamaño del Texto',
      editor_preview: 'Previsualizar Diapositivas',
      editor_move_up: 'Mover Arriba',
      editor_move_down: 'Mover Abajo',
      editor_move_left: 'Mover Izquierda',
      editor_move_right: 'Mover Derecha',
      editor_increase_size: 'Aumentar Tamaño',
      editor_decrease_size: 'Reducir Tamaño',
      preview_title: 'Previsualización',
      preview_export: 'Exportar Diapositivas',
      preview_success: '¡Diapositivas exportadas exitosamente!',
      preview_empty: 'No hay diapositivas para previsualizar',
      settings_title: 'Configuración',
      settings_theme: 'Tema',
      settings_language: 'Idioma',
      settings_sound: 'Sonido',
      settings_haptics: 'Hápticos',

      // Speech Recognition
      speech_permission_denied: 'Permiso Requerido',
      speech_permission_settings: 'Por favor, habilita el acceso al micrófono en Configuración.',
      speech_not_available: 'No Disponible',
      speech_not_available_message: 'El reconocimiento de voz no está disponible en este dispositivo.',
      speech_error: 'Error de reconocimiento de voz. Inténtalo de nuevo.',
    },
  },
};

// Initialize i18n
i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: typeof i18n.t;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { preferences, updatePreferences } = usePreferences();
  
  const setLanguage = (language: Language) => {
    updatePreferences({ language });
    i18n.changeLanguage(language);
  };

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage: preferences.language, 
      setLanguage, 
      t: i18n.t 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;