import { layout } from './layout.mjs';
import { renderHome } from './pages/home.mjs';
import { renderProjects } from './pages/projects.mjs';
import { renderBlog, renderBlogPost, publishedPosts } from './pages/blog.mjs';
import { renderCV } from './pages/cv.mjs';

export function renderPages({ publicBuild = false } = {}) {
  const pages=[
    {path:'index.html',pathname:'/',page:'home',title:'Jiwon Jung — flyjung.kr',description:'정지원의 포트폴리오. 프로젝트, 경력과 활동, 그리고 개발 기록.',body:renderHome()},
    {path:'projects/index.html',pathname:'/projects/',page:'projects',title:'프로젝트 — flyjung.kr',description:'신성인과 MOMU / 모무. 직접 만든 화면과 구현 과정.',body:renderProjects()},
    {path:'blog/index.html',pathname:'/blog/',page:'blog',title:'글 — flyjung.kr',description:'프로젝트와 개발, 기획, 활동을 기록합니다.',body:renderBlog()},
    {path:'cv/index.html',pathname:'/cv/',page:'cv',title:'CV — flyjung.kr',description:'정지원의 경력과 활동, 프로젝트, 학력과 수상.',body:renderCV()},
    {path:'404.html',pathname:'/404.html',page:'404',noindex:true,title:'페이지를 찾을 수 없습니다 — flyjung.kr',description:'요청한 페이지를 찾을 수 없습니다.',body:'<div class="not-found"><h1>페이지를 찾을 수 없습니다.</h1><p>주소가 바뀌었거나 더 이상 제공되지 않는 페이지입니다.</p><a href="/">홈으로 돌아가기 →</a></div>'},
    ...publishedPosts.map(post=>({path:`blog/${post.slug}/index.html`,pathname:`/blog/${post.slug}/`,page:'article',title:`${post.title} — flyjung.kr`,description:post.summary||post.title,body:renderBlogPost(post)})),
  ];
  return pages.map(page=>({path:page.path,html:layout({...page,publicBuild})}));
}
