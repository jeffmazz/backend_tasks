# Backend do Projeto Tasks List

## Descrição
Backend feito para atender as chamadas das rotas, manipular os dados do MySQL e a renderização das funções presentes no [frontend](https://github.com/jeffmazz/frontend_tasks) do projeto Tasks.

---

## Por que fiz?
O projeto foi realizado para fins de estudo e para demonstração das habilidades que possuo com as tecnologias presentes.

---

## Tecnologias Utilizadas
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

### table 1/2 - **users**

<table>
	<thead>
		<tr>
  			<td> Nome </td>
  			<td> Tipo </td>
  			<td> Exemplo </td>
		</tr>
  	</thead>
  	<tr>
  		<td> user_id </td>
    	<td> INT(11) AUTO_INCREMENT NOT NULL PRIMARY KEY </td>
    	<td> 1 </td>
  	</tr>
  	<tr>
  		<td> name </td>
    	<td> VARCHAR(100) NOT NULL </td>
    	<td> 'Jefferson' </td>
  	</tr>
  	<tr>
  		<td> email </td>
    	<td> VARCHAR(255) UNIQUE NOT NULL </td>
    	<td> 'jeff@gmail.com' </td>
  	</tr>
  	<tr>
  		<td> password </td>
    	<td> varchar(255) NOT NULL </td>
    	<td> $2b$10$KqfQnJfMBP26X... </td>
  	</tr>
  	<tr>
  		<td> isActive </td>
    	<td> tinyint(1) NOT NULL  </td>
    	<td> 1 </td>
  	</tr>
</table>

### table 2/2 - **tasks_list**

*Columns*
- task_id - int(11) AI PK
- task_description - varchar(255)
- status - varchar(50)
- user_id - int(11)

- Foreing Key: fk_user
- Foreign Key Definition: *Target users (user_id > user_id) - On Update RESTRICT - On Delete CASCADE*


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
