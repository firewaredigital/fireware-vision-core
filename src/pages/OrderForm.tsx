import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import { CustomFieldsRenderer } from '@/components/CustomFieldsRenderer';
import { useCustomFieldDefinitions, useCustomFieldValues, useSaveCustomFieldValues, getFieldValue } from '@/hooks/useCustomFields';

interface OrderItem {
  id: string;
  product_id: string | null;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
}

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    account_id: '',
    contact_id: '',
    shipping_method: '',
    shipping_total: 0,
    payment_method: '',
    customer_notes: '',
    internal_notes: '',
    shipping_address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Brasil',
    },
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Custom Fields
  const { data: customFieldDefs = [] } = useCustomFieldDefinitions('order');
  const { data: existingCustomValues = [] } = useCustomFieldValues('order', isEditing ? id : undefined);
  const saveCustomFields = useSaveCustomFieldValues();

  // Initialize custom field values when editing
  useEffect(() => {
    if (isEditing && customFieldDefs.length > 0 && existingCustomValues.length > 0) {
      const initial: Record<string, any> = {};
      customFieldDefs.forEach((def) => {
        const fieldValue = existingCustomValues.find((v) => v.field_definition_id === def.id);
        initial[def.id] = getFieldValue(def, fieldValue);
      });
      setCustomFieldValues(initial);
    }
  }, [isEditing, customFieldDefs, existingCustomValues]);

  // Fetch accounts
  const { data: accounts } = useQuery({
    queryKey: ['accounts-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch contacts based on selected account
  const { data: contacts } = useQuery({
    queryKey: ['contacts-select', formData.account_id],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .order('first_name');

      if (formData.account_id) {
        query = query.eq('account_id', formData.account_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products-select', productSearch],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, sku, unit_price')
        .eq('is_active', true)
        .order('name')
        .limit(20);

      if (productSearch) {
        query = query.or(`name.ilike.%${productSearch}%,sku.ilike.%${productSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing order for editing
  const { data: existingOrder } = useQuery({
    queryKey: ['order-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  const { data: existingItems } = useQuery({
    queryKey: ['order-items-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Load existing data
  useEffect(() => {
    if (existingOrder) {
      const shippingAddr = existingOrder.shipping_address as any || {};
      setFormData({
        account_id: existingOrder.account_id || '',
        contact_id: existingOrder.contact_id || '',
        shipping_method: existingOrder.shipping_method || '',
        shipping_total: Number(existingOrder.shipping_total) || 0,
        payment_method: existingOrder.payment_method || '',
        customer_notes: existingOrder.customer_notes || '',
        internal_notes: existingOrder.internal_notes || '',
        shipping_address: {
          street: shippingAddr.street || '',
          number: shippingAddr.number || '',
          complement: shippingAddr.complement || '',
          neighborhood: shippingAddr.neighborhood || '',
          city: shippingAddr.city || '',
          state: shippingAddr.state || '',
          zip_code: shippingAddr.zip_code || '',
          country: shippingAddr.country || 'Brasil',
        },
      });
    }
  }, [existingOrder]);

  useEffect(() => {
    if (existingItems) {
      setItems(existingItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        name: item.name,
        sku: item.sku || '',
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        discount: Number(item.discount) || 0,
        tax: Number(item.tax) || 0,
        total: Number(item.total),
      })));
    }
  }, [existingItems]);

  const addItem = (product: any) => {
    const newItem: OrderItem = {
      id: crypto.randomUUID(),
      product_id: product.id,
      name: product.name,
      sku: product.sku || '',
      quantity: 1,
      unit_price: Number(product.price) || 0,
      discount: 0,
      tax: 0,
      total: Number(product.price) || 0,
    };
    setItems([...items, newItem]);
    setProductSearch('');
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = (updated.unit_price * updated.quantity) - updated.discount + updated.tax;
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const discountTotal = items.reduce((sum, item) => sum + item.discount, 0);
    const taxTotal = items.reduce((sum, item) => sum + item.tax, 0);
    const shippingTotal = formData.shipping_total;
    const grandTotal = subtotal - discountTotal + taxTotal + shippingTotal;

    return { subtotal, discountTotal, taxTotal, shippingTotal, grandTotal };
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('Organização não encontrada');
      if (items.length === 0) throw new Error('Adicione pelo menos um item');

      const totals = calculateTotals();

      // Generate order number
      const { data: orderNumber } = await supabase.rpc('generate_order_number', {
        org_id: profile.organization_id,
      });

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          organization_id: profile.organization_id,
          order_number: orderNumber || `ORD-${Date.now()}`,
          account_id: formData.account_id || null,
          contact_id: formData.contact_id || null,
          status: 'pending',
          subtotal: totals.subtotal,
          discount_total: totals.discountTotal,
          tax_total: totals.taxTotal,
          shipping_total: totals.shippingTotal,
          grand_total: totals.grandTotal,
          shipping_method: formData.shipping_method || null,
          payment_method: formData.payment_method || null,
          shipping_address: formData.shipping_address,
          customer_notes: formData.customer_notes || null,
          internal_notes: formData.internal_notes || null,
          created_by: profile.id,
          source: 'admin',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        tax: item.tax,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: (order) => {
      // Save custom fields
      if (customFieldDefs.length > 0 && Object.keys(customFieldValues).length > 0) {
        saveCustomFields.mutate({
          entityType: 'order',
          entityId: order.id,
          values: customFieldValues,
          definitions: customFieldDefs,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Pedido criado com sucesso');
      navigate(`/orders/${order.id}`);
    },
    onError: (error) => {
      toast.error('Erro ao criar pedido: ' + error.message);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totals = calculateTotals();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Pedido' : 'Novo Pedido'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualize os dados do pedido' : 'Crie um pedido manualmente'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer */}
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Conta/Empresa</Label>
                  <Select
                    value={formData.account_id}
                    onValueChange={(value) => setFormData({ ...formData, account_id: value, contact_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contato</Label>
                  <Select
                    value={formData.contact_id}
                    onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um contato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts?.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Itens do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produto por nome ou SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Product Search Results */}
                {productSearch && products && products.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-muted cursor-pointer flex items-center justify-between"
                        onClick={() => addItem({ ...product, price: product.unit_price })}
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(Number(product.unit_price) || 0)}</p>
                          <Button size="sm" variant="ghost">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Items Table */}
                {items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-[80px]">Qtd</TableHead>
                        <TableHead className="w-[120px]">Preço Unit.</TableHead>
                        <TableHead className="w-[100px]">Desconto</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{item.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum item adicionado. Busque e adicione produtos acima.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Rua</Label>
                  <Input
                    value={formData.shipping_address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, street: e.target.value }
                    })}
                    placeholder="Nome da rua"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.shipping_address.number}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, number: e.target.value }
                    })}
                    placeholder="Número"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={formData.shipping_address.complement}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, complement: e.target.value }
                    })}
                    placeholder="Apto, Bloco, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.shipping_address.neighborhood}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, neighborhood: e.target.value }
                    })}
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formData.shipping_address.zip_code}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, zip_code: e.target.value }
                    })}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.shipping_address.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, city: e.target.value }
                    })}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={formData.shipping_address.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      shipping_address: { ...formData.shipping_address, state: e.target.value }
                    })}
                    placeholder="UF"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Notas do Cliente</Label>
                  <Textarea
                    value={formData.customer_notes}
                    onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                    placeholder="Instruções especiais do cliente..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notas Internas</Label>
                  <Textarea
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    placeholder="Notas para a equipe interna..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Fields */}
            {customFieldDefs.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <CustomFieldsRenderer
                    entityType="order"
                    definitions={customFieldDefs}
                    values={customFieldValues}
                    onChange={setCustomFieldValues}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({items.length} itens)</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.discountTotal > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descontos</span>
                      <span>-{formatCurrency(totals.discountTotal)}</span>
                    </div>
                  )}
                  {totals.taxTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impostos</span>
                      <span>{formatCurrency(totals.taxTotal)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Método de Envio</Label>
                  <Select
                    value={formData.shipping_method}
                    onValueChange={(value) => setFormData({ ...formData, shipping_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Padrão</SelectItem>
                      <SelectItem value="express">Expresso</SelectItem>
                      <SelectItem value="pickup">Retirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor do Frete</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shipping_total}
                    onChange={(e) => setFormData({ ...formData, shipping_total: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="bank_transfer">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{formatCurrency(totals.shippingTotal)}</span>
                </div>

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => createOrderMutation.mutate()}
                  disabled={createOrderMutation.isPending || items.length === 0}
                >
                  {createOrderMutation.isPending ? 'Criando...' : 'Criar Pedido'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
