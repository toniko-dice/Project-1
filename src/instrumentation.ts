/**
 * Изпълнява се веднъж при пускане на сървъра, преди Payload да отвори базата.
 *
 * Тук няма нищо от Node — целият код за възстановяване е в
 * `./restore-on-boot`, който се зарежда само в Node средата. Next компилира
 * този файл и за Edge runtime; ако `fs` и `path` стояха тук, всяка заявка
 * щеше да предизвиква неуспешна компилация и сайтът щеше да пълзи.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./restore-on-boot')
  }
}
