# Backend do Projeto Tasks List

## Descrição
Backend feito para atender as chamadas das rotas, manipular os dados do MySQL e a renderização das funções presentes no [frontend](https://github.com/jeffmazz/frontend_tasks) do projeto Tasks.

---

## Por que fiz?
O projeto foi realizado para fins de estudo e para demonstração das habilidades que possuo com as tecnologias presentes.

---

## Tecnologias Utilizadas
- HTML
- CSS
- JavaScript
- Node + Express
- MySQL
- MySQL Workbench

---

## Dependências do Projeto
- **bcrypt**: para hash de senhas e comparações
- **cors**: Para permitir requisições de diferentes domínios
- **nodemailer**: Para envio de e-mails
- **jsonwebtoken**: Para autêncicação
- **mysql2**: Driver MySQL
- **express**: Framework para Node.js
- **dotenv**: Para o gerenciamento de variáveis de ambiente

---

## Tabelas no Banco de Dados

### Schema
**todolist**

### table 1/2 - **tasks_list**

*Columns*
- task_id - int(11) AI PK
- task_description - varchar(255)
- status - varchar(50)
- user_id - int(11)

- Foreing Key: fk_user
- Foreign Key Definition: *Target users (user_id > user_id) - On Update RESTRICT - On Delete CASCADE*

### table 2/2 - **users**

*Columns*
- user_id - int(11) AI PK
- name - varchar(100)
- email - varchar(100) UNIQUE
- password - varchar(255)
- isActive - tinyint(1) (alterna de false para true (de 0 para 1) após ativação da conta por e-mail)

---

## Instalação
1. Clone o Repositório ``` bash git clone https://github.com/jeffmazz/backend_tasks.git ```
2. Navegue até a pasta do projeto ``` cd backend ```
3. Instale as dependências -  ```npm install```
4. Configure suas variáveis de ambiente no arquivo .env
5. Execute o servidor ```node server```

---

## Licença
**MIT**

---

## Considerações Finais
Caso queira você também pode estar acessando o front-end para ver a experiência completa do projeto clicando [aqui](https://github.com/jeffmazz/frontend_tasks)