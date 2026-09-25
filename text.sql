create table products (
    id int auto_increment primary key,
    name varchar(100),
    price decimal(10,2),
    quantity int
);

insert into products (name, price, quantity)
values ('Coca cola 330ml - Plastic', 1000, 15);

insert into products (name, price, quantity)
values
('Pepso cola 330ml - Plastic', 1000, 10),
('Oner mango 500ml - Plastic', 2500, 24),
('Eggs', 500, 12),
('Tomato sauce', 200, 100);

select * from products;
select name, price from products;
select * from products where name = 'eggs';
select * from products where price = 2500;
select * from products where price < 2000;
select * from products where quantity < 25;
select * from products order by name asc;
select * from products order by name desc;
select * from products limit 2;
select * from products where name like '%on%';
select * from products where price is null;


update products set price = 1000 where name = 'eggs';

delete from products where name = 'eggs';
delete from products;
