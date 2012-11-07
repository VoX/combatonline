-- drop tables
drop table if exists users;

-- create tables
create table users(
  uid integer not null auto_increment,
  name varchar(16) not null, 
  email varchar(140) not null,
  hash varchar(40) not null,
  score integer not null,
  session varchar(200),
  primary key (uid),
  UNIQUE (name) 
);

insert into users values
  (uid, 'vox', 'icopy11@gmail.com', 'test', 5, NULL);