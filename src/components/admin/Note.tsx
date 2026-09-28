'use client'

/**
 * Пояснение вътре в блок или група в админа.
 *
 * Payload дава `admin.description` на полетата, но не и на блоковете. Блок,
 * който няма какво да се настройва в него, иначе се отваря празен и не
 * казва къде тогава се настройва — точно това се случи с лентата с
 * категории. Тук стои изречението, което го казва.
 *
 * Слага се като поле `type: 'ui'` с текст в `clientProps`. Не се записва
 * нищо: `ui` полетата не съществуват в базата.
 *
 * Клиентски компонент, както другите в тази папка: `clientProps` стигат
 * и до сървърен, но еднаквостта спестява изненади.
 *
 * След добавяне или преместване на такова поле трябва
 * `npm run generate:importmap`.
 */
export const Note = ({ text }: { text?: string }) => {
  if (!text) return null

  return (
    <p
      className="field-description"
      style={{ marginBottom: 'var(--base)', color: 'var(--theme-elevation-500)' }}
    >
      {text}
    </p>
  )
}

export default Note
