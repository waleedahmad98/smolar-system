import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import SolarSystemComponent from '../components/SolarSystemComponent'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Smolar System - Interactive Solar System</title>
        <meta name="description" content="Interactive Solar System App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

    
      <main>
        <SolarSystemComponent />
      </main>
    </div>
  )
}
