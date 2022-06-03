/* eslint-disable react/no-danger */
import PrismicDom, { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const textContent = post.data.content.reduce(
    (prevContent, currentContent) => {
      const textAmount = [...prevContent];

      const headingText = currentContent.heading;
      const bodyText = PrismicDom.RichText.asText(currentContent.body);

      textAmount.push(headingText, bodyText);

      return textAmount;
    },
    []
  );

  const wordCount = textContent.toString().split(/[,.\s]/).length;

  const estimatedReadingTime = Math.ceil(wordCount / 200);

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{`${post.data.title} | spacetraveling`}</title>
      </Head>
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <div className={commonStyles.container}>
        <main className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <div className={styles.infoContent}>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </div>
            <div className={styles.infoContent}>
              <FiUser />
              {post.data.author}
            </div>
            <div className={styles.infoContent}>
              <FiClock />
              {estimatedReadingTime} min
            </div>
          </div>
          <div className={styles.content}>
            {post.data.content.map(content => (
              <div key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  className={styles.postContent}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('post');

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});

  const response = await prismic.getByUID('post', String(slug));

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
