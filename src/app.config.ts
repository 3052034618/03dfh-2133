export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/members/index',
    'pages/profile/index',
    'pages/game-detail/index',
    'pages/publish-game/index',
    'pages/edit-profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#6B4EFF',
    navigationBarTitleText: '硬核推理社',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#6B4EFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/members/index',
        text: '社员池'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
