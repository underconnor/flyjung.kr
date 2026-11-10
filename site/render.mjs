import { layout } from './layout.mjs';
import { siteDescription } from './metadata.mjs';
import { renderHome } from './home/render.mjs';
import { renderProjects } from './pages/projects.mjs';
import { renderBlog, renderBlogPost, publishedPosts } from './pages/blog.mjs';
import { renderCV } from './pages/cv.mjs';

export function renderPages({ publicBuild = false } = {}) {
  const pages=[
    {path:'projects/index.html',pathname:'/projects/',page:'projects',title:'Projects — flyjung.',description:siteDescription,body:renderProjects()},
    {path:'blog/index.html',pathname:'/blog/',page:'blog',title:'Blog — flyjung.',description:siteDescription,body:renderBlog()},
    {path:'cv/index.html',pathname:'/cv/',page:'cv',title:'CV — flyjung.',description:siteDescription,body:renderCV()},
    {path:'404.html',pathname:'/404.html',page:'404',noindex:true,title:'페이지를 찾을 수 없습니다 — flyjung.',description:siteDescription,body:'<div class="not-found"><h1>페이지를 찾을 수 없습니다.</h1><p>주소가 바뀌었거나 더 이상 제공되지 않는 페이지입니다.</p><a href="/">홈으로 돌아가기 →</a></div>'},
    ...publishedPosts.map(post=>({path:`blog/${post.slug}/index.html`,pathname:`/blog/${post.slug}/`,page:'article',title:`${post.title} — flyjung.`,description:post.summary||post.title,body:renderBlogPost(post)})),
  ];
  return [{path:'index.html',html:renderHome({publicBuild})}, ...pages.map(page=>({path:page.path,html:layout({...page,publicBuild})}))];
}
