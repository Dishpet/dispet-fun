import { Card } from "@/components/ui/card";
import hatImg from "@/assets/products/hat.png";
import hoodieImg from "@/assets/products/hoodie.png";
import mugImg from "@/assets/products/mug.png";
import phoneCaseImg from "@/assets/products/phone-case.png";

const products = [
  { id: 1, name: 'Premium Kapa', image: hatImg, price: '24,99 €' },
  { id: 2, name: 'Udoban Hoodie', image: hoodieImg, price: '49,99 €' },
  { id: 3, name: 'Kavna Šalica', image: mugImg, price: '14,99 €' },
  { id: 4, name: 'Maska za Mobitel', image: phoneCaseImg, price: '19,99 €' },
];

export const ProductShowcase = () => {
  return (
    <section className="bg-white py-20">
      <div className="container px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-heading font-bold sm:text-4xl">Dostupni Proizvodi</h2>
          <p className="text-lg text-muted-foreground">
            Vaši prilagođeni dizajni izgledaju nevjerojatno na bilo kojem od ovih proizvoda
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="group overflow-hidden transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="aspect-square overflow-hidden bg-background">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-contain p-8 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="mb-2 font-semibold">{product.name}</h3>
                <p className="text-lg font-bold text-primary">{product.price}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
